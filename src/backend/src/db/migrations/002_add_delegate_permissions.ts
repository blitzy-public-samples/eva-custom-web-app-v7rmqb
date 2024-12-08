// @package sequelize v6.31.0
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

/**
 * Human Tasks:
 * 1. Verify that the database user has sufficient privileges to modify tables and add constraints
 * 2. Review cascade delete behavior for delegate permission relationships
 * 3. Ensure indexes are properly configured for performance optimization
 * 4. Validate that existing delegate data is compatible with the new schema
 */

/**
 * Migration to add delegate permissions schema changes
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements schema changes to support role-based access control by adding delegate permissions.
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Enhances the database schema to manage delegate permissions and their relationships.
 */
export const up = async (queryInterface: QueryInterface, Sequelize: any): Promise<void> => {
  // Create delegate_permissions junction table
  await queryInterface.createTable('delegate_permissions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    delegateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'delegates',
        key: 'delegateId'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'permissionId'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Add indexes for performance optimization
  await queryInterface.addIndex('delegate_permissions', ['delegateId'], {
    name: 'idx_delegate_permissions_delegate'
  });

  await queryInterface.addIndex('delegate_permissions', ['permissionId'], {
    name: 'idx_delegate_permissions_permission'
  });

  await queryInterface.addIndex('delegate_permissions', ['resourceType', 'accessLevel'], {
    name: 'idx_delegate_permissions_resource_access'
  });

  // Add composite unique constraint to prevent duplicate permissions
  await queryInterface.addConstraint('delegate_permissions', {
    fields: ['delegateId', 'permissionId', 'resourceType'],
    type: 'unique',
    name: 'unique_delegate_permission_resource'
  });

  // Modify delegates table to update permissions column
  await queryInterface.changeColumn('delegates', 'permissions', {
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
  });
};

/**
 * Reverts the migration by dropping the delegate permissions table and reverting schema changes
 */
export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Drop indexes
  await queryInterface.removeIndex('delegate_permissions', 'idx_delegate_permissions_delegate');
  await queryInterface.removeIndex('delegate_permissions', 'idx_delegate_permissions_permission');
  await queryInterface.removeIndex('delegate_permissions', 'idx_delegate_permissions_resource_access');

  // Drop constraint
  await queryInterface.removeConstraint('delegate_permissions', 'unique_delegate_permission_resource');

  // Drop delegate_permissions table
  await queryInterface.dropTable('delegate_permissions');

  // Revert changes to delegates table permissions column
  await queryInterface.changeColumn('delegates', 'permissions', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  });
};