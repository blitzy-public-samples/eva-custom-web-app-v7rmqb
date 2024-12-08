// @package sequelize v6.31.0
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';
import { DelegateTypes } from '../types/delegate.types';
import { UserModel } from './user.model';
import { validateDelegate } from '../utils/validation.util';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured in database.config.ts
 * 2. Verify that the database indexes are optimized for common delegate queries
 * 3. Review cascade delete behavior for delegate-user relationships
 * 4. Confirm that the permissions array column is properly configured for your database type
 */

// Interface for Delegate attributes during creation
interface DelegateCreationAttributes extends Optional<DelegateTypes, 'delegateId'> {}

/**
 * Sequelize model for the Delegate entity
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements database model for managing delegate relationships and permissions
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Supports RBAC by defining relationships between delegates, permissions, and users
 */
export class DelegateModel extends Model<DelegateTypes, DelegateCreationAttributes> implements DelegateTypes {
  public delegateId!: string;
  public ownerId!: string;
  public permissions!: Array<{ permissionId: string; resourceType: string; accessLevel: string }>;
  public role!: string;
  public expiresAt!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Defines the relationships between the Delegate model and other models
   * @param models - The models object containing all models in the application
   */
  public static associate(models: any): void {
    DelegateModel.belongsTo(UserModel, {
      foreignKey: 'ownerId',
      as: 'owner',
      onDelete: 'CASCADE'
    });
  }

  /**
   * Validates delegate data before saving to the database
   * @param delegateData - The delegate data to validate
   * @returns boolean indicating if the data is valid
   * @throws Error if validation fails
   */
  public static validateDelegateData(delegateData: DelegateTypes): boolean {
    if (!validateDelegate(delegateData)) {
      throw new Error('Invalid delegate data structure');
    }
    return true;
  }
}

// Initialize the Delegate model with its schema
DelegateModel.init(
  {
    delegateId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidPermissionsArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Permissions must be an array');
          }
          value.forEach((permission: any) => {
            if (!permission.permissionId || !permission.resourceType || !permission.accessLevel) {
              throw new Error('Invalid permission structure');
            }
          });
        }
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString() // Must be a future date
      }
    }
  },
  {
    sequelize,
    tableName: 'delegates',
    timestamps: true,
    indexes: [
      {
        fields: ['ownerId']
      },
      {
        fields: ['role']
      },
      {
        fields: ['expiresAt']
      }
    ]
  }
);

export default DelegateModel;