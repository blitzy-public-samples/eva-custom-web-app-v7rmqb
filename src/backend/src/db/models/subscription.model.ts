// @package sequelize v6.31.0
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';
import { SubscriptionPlan } from '../types/subscription.types';
import { UserModel } from './user.model';
import { encryptData } from '../utils/encryption.util';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured in database.config.ts
 * 2. Verify that the encryption key is set in environment variables for encrypting planId
 * 3. Review database indexes for subscription queries optimization
 * 4. Confirm that the subscription status values align with payment gateway requirements
 */

// Interface for Subscription attributes during creation
interface SubscriptionCreationAttributes extends Optional<SubscriptionModel, 'subscriptionId'> {}

/**
 * Sequelize model for the Subscription entity
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements the database model for managing subscription plans and user subscriptions
 */
export class SubscriptionModel extends Model<SubscriptionModel, SubscriptionCreationAttributes> {
  public subscriptionId!: string;
  public userId!: string;
  public planId!: string;
  public status!: 'active' | 'inactive' | 'cancelled';
  public startDate!: Date;
  public endDate!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Finds all subscriptions associated with a specific user ID
   * @param userId - The ID of the user to find subscriptions for
   * @returns Promise resolving to an array of subscription records
   */
  public static async findByUserId(userId: string): Promise<SubscriptionModel[]> {
    return SubscriptionModel.findAll({
      where: {
        userId,
      },
      order: [['startDate', 'DESC']],
    });
  }

  /**
   * Updates the status of a subscription
   * @param subscriptionId - The ID of the subscription to update
   * @param status - The new status to set
   * @returns Promise resolving to true if successful, false otherwise
   */
  public static async updateSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'inactive' | 'cancelled'
  ): Promise<boolean> {
    try {
      const subscription = await SubscriptionModel.findByPk(subscriptionId);
      if (!subscription) return false;

      await subscription.update({ status });
      return true;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      return false;
    }
  }
}

// Initialize the Subscription model with its schema
SubscriptionModel.init(
  {
    subscriptionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId',
      },
    },
    planId: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value: string) {
        // Encrypt planId before storing
        this.setDataValue('planId', encryptData(value));
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
      allowNull: false,
      defaultValue: 'inactive',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['startDate', 'endDate'],
      },
    ],
  }
);

// Set up association with User model
SubscriptionModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'user',
});

export default SubscriptionModel;