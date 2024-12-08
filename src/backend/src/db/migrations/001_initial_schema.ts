// @package sequelize v6.31.0
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

/**
 * Human Tasks:
 * 1. Verify that the database user has sufficient privileges to create tables and indexes
 * 2. Ensure the database encoding is set to UTF-8
 * 3. Review cascade delete behaviors for all foreign key relationships
 * 4. Confirm that the database server has sufficient storage capacity
 * 5. Set up automated database backups before running migrations
 */

/**
 * Executes the migration to create the initial database schema
 * Requirements Addressed:
 * - Database Initialization (Technical Specifications/2.3 Component Details/Backend)
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * - Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 */
export const up = async (queryInterface: QueryInterface, Sequelize: any): Promise<void> => {
  // Create Users table
  await queryInterface.createTable('users', {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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

  // Create Documents table
  await queryInterface.createTable('documents', {
    documentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('medical', 'financial', 'legal', 'personal'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      },
      onDelete: 'CASCADE'
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

  // Create Delegates table
  await queryInterface.createTable('delegates', {
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
      },
      onDelete: 'CASCADE'
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
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

  // Create Subscriptions table
  await queryInterface.createTable('subscriptions', {
    subscriptionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      },
      onDelete: 'CASCADE'
    },
    planId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
      allowNull: false,
      defaultValue: 'inactive'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
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

  // Create Permissions table
  await queryInterface.createTable('permissions', {
    permissionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accessLevel: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      },
      onDelete: 'CASCADE'
    },
    delegateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'delegates',
        key: 'delegateId'
      },
      onDelete: 'CASCADE'
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

  // Create AuditLogs table
  await queryInterface.createTable('audit_logs', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      },
      onDelete: 'CASCADE'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    sourceIp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    requestId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    resourceIds: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
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

  // Create indexes for better query performance
  await queryInterface.addIndex('users', ['email']);
  await queryInterface.addIndex('users', ['role']);
  await queryInterface.addIndex('documents', ['userId', 'category']);
  await queryInterface.addIndex('documents', ['status']);
  await queryInterface.addIndex('delegates', ['ownerId']);
  await queryInterface.addIndex('delegates', ['expiresAt']);
  await queryInterface.addIndex('subscriptions', ['userId', 'status']);
  await queryInterface.addIndex('subscriptions', ['startDate', 'endDate']);
  await queryInterface.addIndex('permissions', ['userId', 'resourceType']);
  await queryInterface.addIndex('permissions', ['delegateId', 'resourceType']);
  await queryInterface.addIndex('audit_logs', ['userId', 'timestamp']);
  await queryInterface.addIndex('audit_logs', ['action', 'severity']);
};

/**
 * Reverts the migration by dropping all created tables
 */
export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Drop tables in reverse order to handle foreign key constraints
  await queryInterface.dropTable('audit_logs');
  await queryInterface.dropTable('permissions');
  await queryInterface.dropTable('subscriptions');
  await queryInterface.dropTable('delegates');
  await queryInterface.dropTable('documents');
  await queryInterface.dropTable('users');
};