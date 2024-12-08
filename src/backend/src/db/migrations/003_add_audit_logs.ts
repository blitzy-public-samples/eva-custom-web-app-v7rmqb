// sequelize v6.32.1
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { AuditModel } from '../models/audit.model';
import { UserModel } from '../models/user.model';

/**
 * Human Tasks:
 * 1. Verify that the database user has sufficient privileges to create tables and indexes
 * 2. Review and adjust index definitions based on expected query patterns
 * 3. Configure appropriate table partitioning strategy for audit logs
 * 4. Set up automated cleanup/archival process for old audit logs
 */

/**
 * Migration to create the audit_logs table
 * Requirement: Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 * Implements logging mechanisms to track system activities and ensure compliance with security standards.
 */
export const up = async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
  await queryInterface.createTable('audit_logs', {
    id: {
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
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(['USER_LOGIN', 'USER_LOGOUT', 'USER_PROFILE_UPDATE', 'USER_PASSWORD_CHANGE',
          'USER_MFA_UPDATE', 'DOCUMENT_UPLOAD', 'DOCUMENT_VIEW', 'DOCUMENT_UPDATE', 'DOCUMENT_DELETE',
          'DOCUMENT_SHARE', 'DELEGATE_INVITE', 'DELEGATE_ACCEPT', 'DELEGATE_REMOVE',
          'DELEGATE_PERMISSION_UPDATE', 'SYSTEM_ERROR', 'SYSTEM_CONFIG_UPDATE', 'SYSTEM_MAINTENANCE'])],
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    severity: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['INFO', 'WARNING', 'ERROR', 'CRITICAL']],
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['SUCCESS', 'FAILURE', 'PENDING', 'CANCELLED']],
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    sourceIp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requestId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    resourceIds: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    indexes: [
      {
        name: 'idx_audit_timestamp_user',
        fields: ['timestamp', 'userId'],
      },
      {
        name: 'idx_audit_action_severity',
        fields: ['action', 'severity'],
      },
      {
        name: 'idx_audit_request',
        fields: ['requestId'],
      },
      {
        name: 'idx_audit_status',
        fields: ['status'],
      },
      {
        name: 'idx_audit_timestamp',
        fields: ['timestamp'],
      },
    ],
  });
};

/**
 * Revert the migration by dropping the audit_logs table
 * Requirement: Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 */
export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('audit_logs');
};