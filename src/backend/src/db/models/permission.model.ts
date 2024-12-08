// @package sequelize v6.31.0
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';
import { PermissionTypes } from '../types/permission.types';
import { UserModel } from './user.model';
import { DelegateModel } from './delegate.model';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured in database.config.ts
 * 2. Verify that the database indexes are optimized for common permission queries
 * 3. Review cascade delete behavior for permission relationships
 * 4. Confirm that the access level values match the system requirements
 */

// Interface for Permission attributes during creation
interface PermissionCreationAttributes extends Optional<PermissionTypes, 'permissionId'> {}

/**
 * Sequelize model for the Permission entity
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements the database model for managing permissions, enabling secure and granular access control.
 */
export class PermissionModel extends Model<PermissionTypes, PermissionCreationAttributes> implements PermissionTypes {
  public permissionId!: string;
  public resourceType!: string;
  public accessLevel!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Defines the relationships between the Permission model and other models
   * @param models - The models object containing all models in the application
   */
  public static associate(models: any): void {
    PermissionModel.belongsTo(UserModel, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    PermissionModel.belongsTo(DelegateModel, {
      foreignKey: 'delegateId',
      as: 'delegate',
      onDelete: 'CASCADE'
    });
  }

  /**
   * Validates permission data before saving to the database
   * @param permissionData - The permission data to validate
   * @returns boolean indicating if the data is valid
   * @throws Error if validation fails
   */
  public static validatePermissionData(permissionData: PermissionTypes): boolean {
    if (!permissionData.resourceType || !permissionData.accessLevel) {
      throw new Error('Invalid permission data: resourceType and accessLevel are required');
    }

    // Validate access level
    const validAccessLevels = ['read', 'write', 'manage', 'admin'];
    if (!validAccessLevels.includes(permissionData.accessLevel)) {
      throw new Error('Invalid access level');
    }

    // Validate resource type
    const validResourceTypes = ['document', 'profile', 'medical', 'financial', 'legal'];
    if (!validResourceTypes.includes(permissionData.resourceType)) {
      throw new Error('Invalid resource type');
    }

    return true;
  }
}

// Initialize the Permission model with its schema
PermissionModel.init(
  {
    permissionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['document', 'profile', 'medical', 'financial', 'legal']]
      }
    },
    accessLevel: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['read', 'write', 'manage', 'admin']]
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    indexes: [
      {
        fields: ['resourceType']
      },
      {
        fields: ['accessLevel']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['delegateId']
      }
    ]
  }
);

export default PermissionModel;