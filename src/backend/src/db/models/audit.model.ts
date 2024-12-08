// sequelize v6.32.1
import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { AuditLog, AuditActionType, AuditSeverity, AuditStatus } from '../../types/audit.types';
import { logError } from '../../utils/logger.util';
import { initializeDatabase } from '../../config/database';

/**
 * Human Tasks:
 * 1. Ensure PostgreSQL database has appropriate indexes on frequently queried columns
 * 2. Configure audit log retention policy based on compliance requirements
 * 3. Set up automated backup schedule for audit logs
 * 4. Review and adjust database partitioning strategy for audit logs
 */

// Interface for creating a new AuditLog entry (optional id)
interface AuditLogCreationAttributes extends Optional<AuditLog, 'id'> {}

/**
 * Sequelize model for audit logs
 * Requirement: Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 * Implements logging mechanisms to track system activities and ensure compliance
 */
class AuditModel extends Model<AuditLog, AuditLogCreationAttributes> implements AuditLog {
  public id!: string;
  public userId!: string;
  public action!: AuditActionType;
  public timestamp!: Date;
  public details!: Record<string, any>;
  public severity!: AuditSeverity;
  public status!: AuditStatus;
  public metadata!: any;
  public sourceIp?: string;
  public userAgent?: string;
  public requestId?: string;
  public resourceIds?: string[];

  /**
   * Initializes the AuditModel with Sequelize
   * @param sequelize Sequelize instance
   */
  public static initialize(sequelize: Sequelize): void {
    AuditModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          index: true,
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [Object.values(AuditActionType)],
          },
          index: true,
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          index: true,
        },
        details: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        severity: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [Object.values(AuditSeverity)],
          },
          index: true,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [Object.values(AuditStatus)],
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
          index: true,
        },
        resourceIds: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'audit_logs',
        timestamps: true,
        indexes: [
          {
            name: 'idx_audit_timestamp_user',
            fields: ['timestamp', 'userId'],
          },
          {
            name: 'idx_audit_action_severity',
            fields: ['action', 'severity'],
          },
        ],
        schema: 'public',
      }
    );
  }

  /**
   * Logs a new audit entry into the database
   * Requirement: Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
   * 
   * @param auditEntry The audit entry to log
   * @returns Promise resolving to the created audit log entry
   */
  public static async logAuditEntry(auditEntry: AuditLog): Promise<AuditModel> {
    try {
      const sequelize = initializeDatabase();
      AuditModel.initialize(sequelize);

      const createdEntry = await AuditModel.create({
        ...auditEntry,
        timestamp: auditEntry.timestamp || new Date(),
      });

      return createdEntry;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error during audit logging');
      logError(err);
      throw new Error(`Failed to create audit log entry: ${err.message}`);
    }
  }
}

export default AuditModel;