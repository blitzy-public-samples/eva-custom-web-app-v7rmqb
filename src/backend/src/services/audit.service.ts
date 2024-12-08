/**
 * Estate Kit - Audit Service
 * 
 * This service implements audit logging functionality for the Estate Kit backend system.
 * 
 * Human Tasks:
 * 1. Configure audit log retention period based on compliance requirements
 * 2. Set up automated audit log archival process
 * 3. Review and configure audit log monitoring alerts
 * 4. Ensure proper database indexes are created for audit log queries
 */

// @types/node v18.0.0
import { AuditLog, AuditActionType, AuditSeverity, AuditStatus, AuditMetadata } from '../types/audit.types';
import AuditModel from '../db/models/audit.model';
import { logError } from '../utils/logger.util';
import { encryptData } from '../utils/encryption.util';

/**
 * Logs a new audit entry into the database
 * Requirement: Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 * 
 * @param auditEntry The audit entry to be logged
 * @returns Promise resolving to the created audit log entry
 * @throws Error if the audit entry creation fails
 */
export const logAudit = async (auditEntry: AuditLog): Promise<AuditModel> => {
  try {
    // Validate required fields
    if (!auditEntry.userId || !auditEntry.action || !auditEntry.details) {
      throw new Error('Missing required audit log fields');
    }

    // Ensure timestamp is set
    const timestamp = auditEntry.timestamp || new Date();

    // Encrypt sensitive information in details and metadata
    const encryptedDetails = encryptSensitiveData(auditEntry.details);
    const encryptedMetadata = encryptSensitiveData(auditEntry.metadata);

    // Prepare audit entry with encrypted data
    const processedAuditEntry: AuditLog = {
      ...auditEntry,
      timestamp,
      details: encryptedDetails,
      metadata: encryptedMetadata,
      severity: auditEntry.severity || AuditSeverity.INFO,
      status: auditEntry.status || AuditStatus.SUCCESS
    };

    // Log the audit entry to the database
    const createdEntry = await AuditModel.logAuditEntry(processedAuditEntry);

    return createdEntry;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error during audit logging');
    logError(err);
    throw new Error(`Failed to create audit log: ${err.message}`);
  }
};

/**
 * Retrieves audit logs based on specified filters
 * Requirement: Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 * 
 * @param filters Object containing filter criteria
 * @returns Promise resolving to an array of matching audit log entries
 * @throws Error if the retrieval operation fails
 */
export const getAuditLogs = async (filters: {
  userId?: string;
  action?: AuditActionType;
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity;
  status?: AuditStatus;
  limit?: number;
  offset?: number;
}): Promise<AuditModel[]> => {
  try {
    // Validate date range if provided
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Build query conditions
    const whereClause: any = {};
    
    if (filters.userId) {
      whereClause.userId = filters.userId;
    }
    
    if (filters.action) {
      whereClause.action = filters.action;
    }
    
    if (filters.severity) {
      whereClause.severity = filters.severity;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    if (filters.startDate || filters.endDate) {
      whereClause.timestamp = {};
      if (filters.startDate) {
        whereClause.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.timestamp.$lte = filters.endDate;
      }
    }

    // Query the database with pagination
    const auditLogs = await AuditModel.findAll({
      where: whereClause,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
      order: [['timestamp', 'DESC']]
    });

    // Decrypt sensitive data in the retrieved logs
    return auditLogs.map(log => ({
      ...log,
      details: decryptSensitiveData(log.details),
      metadata: decryptSensitiveData(log.metadata)
    }));

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error during audit log retrieval');
    logError(err);
    throw new Error(`Failed to retrieve audit logs: ${err.message}`);
  }
};

/**
 * Helper function to encrypt sensitive data in audit log entries
 * @param data Object containing potentially sensitive data
 * @returns Object with sensitive fields encrypted
 */
const encryptSensitiveData = (data: Record<string, any> | AuditMetadata): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
  const encryptedData = { ...data };

  Object.keys(encryptedData).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      encryptedData[key] = encryptData(String(encryptedData[key]), process.env.ENCRYPTION_KEY!);
    } else if (typeof encryptedData[key] === 'object' && encryptedData[key] !== null) {
      encryptedData[key] = encryptSensitiveData(encryptedData[key]);
    }
  });

  return encryptedData;
};

/**
 * Helper function to decrypt sensitive data in audit log entries
 * @param data Object containing encrypted sensitive data
 * @returns Object with sensitive fields decrypted
 */
const decryptSensitiveData = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
  const decryptedData = { ...data };

  Object.keys(decryptedData).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      decryptedData[key] = encryptData(String(decryptedData[key]), process.env.ENCRYPTION_KEY!);
    } else if (typeof decryptedData[key] === 'object' && decryptedData[key] !== null) {
      decryptedData[key] = decryptSensitiveData(decryptedData[key]);
    }
  });

  return decryptedData;
};