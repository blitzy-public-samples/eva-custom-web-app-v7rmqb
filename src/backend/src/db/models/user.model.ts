// @package sequelize v6.31.0
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';
import { UserTypes } from '../types/user.types';
import { encryptData } from '../utils/encryption.util';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured in database.config.ts
 * 2. Verify that the encryption key is set in environment variables
 * 3. Review password hashing strategy and salt rounds configuration
 * 4. Confirm that database indexes are optimized for common queries
 */

// Interface for User attributes during creation
interface UserCreationAttributes extends Optional<UserTypes, 'userId'> {}

/**
 * Sequelize model for the User entity
 * Requirements Addressed:
 * - User Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 */
export class UserModel extends Model<UserTypes, UserCreationAttributes> implements UserTypes {
  public userId!: string;
  public email!: string;
  public name!: string;
  public role!: 'owner' | 'delegate' | 'admin';
  public permissions!: string[];

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Finds a user by their email address
   * @param email - The email address to search for
   * @returns Promise resolving to the user if found, null otherwise
   */
  public static async findByEmail(email: string): Promise<UserModel | null> {
    return UserModel.findOne({
      where: {
        email: encryptData(email)
      }
    });
  }

  /**
   * Updates the profile information of a user
   * @param userId - The ID of the user to update
   * @param profileData - Partial user data to update
   * @returns Promise resolving to true if successful, false otherwise
   */
  public static async updateProfile(
    userId: string,
    profileData: Partial<UserTypes>
  ): Promise<boolean> {
    try {
      const user = await UserModel.findByPk(userId);
      if (!user) return false;

      // Encrypt sensitive data before updating
      const updatedData: Partial<UserTypes> = {
        ...profileData,
        email: profileData.email ? encryptData(profileData.email) : undefined
      };

      await user.update(updatedData);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }
}

// Initialize the User model with its schema
UserModel.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value: string) {
        // Encrypt email before storing
        this.setDataValue('email', encryptData(value));
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('owner', 'delegate', 'admin'),
      allowNull: false,
      defaultValue: 'owner'
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      }
    ]
  }
);

// Export the User model
export default UserModel;