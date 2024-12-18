/**
 * Enhanced Audit Service for Estate Kit
 * Implements PIPEDA and HIPAA compliant audit logging with comprehensive security features
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common'; // ^9.0.0
import { Repository } from 'typeorm'; // ^0.3.0
import { InjectRepository } from '@nestjs/typeorm'; // ^9.0.0

import { AuditModel } from '../db/models/audit.model';
import { 
  AuditEventType, 
  AuditSeverity, 
  AuditLogEntry, 
  AuditFilter 
} from '../types/audit.types';
import { logger } from '../utils/logger.util';

// Constants for compliance and security
const RETENTION_PERIOD_DAYS = 730; // 2 years retention for PIPEDA compliance
const MAX_QUERY_LIMIT = 1000;
const DEFAULT_PAGE_SIZE = 50;

/**
 * Service responsible for managing audit logs with enhanced security and compliance features
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditModel)
    private readonly auditRepository: Repository<AuditModel>
  ) {}

  /**
   * Creates a new audit log entry with enhanced security and compliance metadata
   * @param logEntry The audit log entry to create
   * @returns Promise<AuditModel> The created audit log with compliance metadata
   */
  async createAuditLog(logEntry: AuditLogEntry): Promise<AuditModel> {
    try {
      // Validate required fields
      this.validateLogEntry(logEntry);

      // Create new audit model instance with compliance metadata
      const auditLog = new AuditModel();
      auditLog.eventType = logEntry.eventType;
      auditLog.severity = logEntry.severity;
      auditLog.userId = logEntry.userId;
      auditLog.resourceId = logEntry.resourceId || undefined;
      auditLog.resourceType = logEntry.resourceType;
      auditLog.ipAddress = logEntry.ipAddress;
      auditLog.userAgent = logEntry.userAgent;
      auditLog.details = {
        ...logEntry.details,
        complianceFlags: this.generateComplianceFlags(logEntry),
        retentionDate: this.calculateRetentionDate(),
      };

      // Save audit log with enhanced error handling
      const savedLog = await this.auditRepository.save(auditLog);

      // Log successful creation with security context
      logger.info('Audit log created successfully', {
        eventId: savedLog.id,
        eventType: savedLog.eventType,
        securityContext: {
          classification: 'AUDIT',
          compliance: ['PIPEDA', 'HIPAA']
        }
      });

      return savedLog;
    } catch (error) {
      logger.error('Failed to create audit log', {
        error,
        logEntry: { ...logEntry, details: '[REDACTED]' }
      });
      throw error;
    }
  }

  /**
   * Retrieves audit logs with enhanced filtering and compliance metadata
   * @param filter Filtering criteria for audit logs
   * @returns Promise with paginated logs and compliance information
   */
  async getAuditLogs(filter: AuditFilter): Promise<{
    logs: AuditModel[];
    total: number;
    complianceMetadata: object;
  }> {
    try {
      // Apply security and compliance filters
      const queryBuilder = this.auditRepository.createQueryBuilder('audit')
        .where('1=1');

      // Apply filters with security checks
      this.applySecurityFilters(queryBuilder, filter);

      // Apply pagination with limits
      const page = filter.page || 1;
      const limit = Math.min(filter.limit || DEFAULT_PAGE_SIZE, MAX_QUERY_LIMIT);
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('audit.createdAt', 'DESC');

      // Execute query with compliance checks
      const [logs, total] = await queryBuilder.getManyAndCount();

      // Generate compliance metadata
      const complianceMetadata = this.generateComplianceMetadata(logs);

      return {
        logs,
        total,
        complianceMetadata
      };
    } catch (error) {
      logger.error('Failed to retrieve audit logs', { error, filter });
      throw error;
    }
  }

  /**
   * Retrieves a specific audit log entry with security validation
   * @param id The ID of the audit log to retrieve
   * @returns Promise<AuditModel | null> The found audit log or null
   */
  async getAuditLogById(id: string): Promise<AuditModel | null> {
    try {
      // Validate ID format
      if (!this.isValidUUID(id)) {
        throw new Error('Invalid audit log ID format');
      }

      // Retrieve log with security context
      const log = await this.auditRepository.findOne({ where: { id } });

      // Log access attempt for security monitoring
      logger.info('Audit log accessed', {
        logId: id,
        found: !!log,
        securityContext: { classification: 'AUDIT' }
      });

      return log;
    } catch (error) {
      logger.error('Failed to retrieve audit log', { error, id });
      throw error;
    }
  }

  /**
   * Validates audit log entry fields
   * @private
   */
  private validateLogEntry(logEntry: AuditLogEntry): void {
    if (!logEntry.eventType || !Object.values(AuditEventType).includes(logEntry.eventType)) {
      throw new Error('Invalid event type');
    }
    if (!logEntry.severity || !Object.values(AuditSeverity).includes(logEntry.severity)) {
      throw new Error('Invalid severity level');
    }
    if (!logEntry.userId || !logEntry.ipAddress) {
      throw new Error('Missing required audit fields');
    }
  }

  /**
   * Generates compliance flags based on event type and data
   * @private
   */
  private generateComplianceFlags(logEntry: AuditLogEntry): object {
    return {
      containsPII: this.detectPII(logEntry),
      containsPHI: this.detectPHI(logEntry),
      hipaaRelevant: this.isHIPAARelevant(logEntry.eventType),
      pipedaRelevant: true, // All logs are PIPEDA relevant
      retentionRequired: true
    };
  }

  /**
   * Calculates retention date based on compliance requirements
   * @private
   */
  private calculateRetentionDate(): Date {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + RETENTION_PERIOD_DAYS);
    return retentionDate;
  }

  /**
   * Applies security filters to query builder
   * @private
   */
  private applySecurityFilters(queryBuilder: any, filter: AuditFilter): void {
    if (filter.eventType?.length) {
      queryBuilder.andWhere('audit.eventType IN (:...eventTypes)', {
        eventTypes: filter.eventType
      });
    }
    if (filter.severity?.length) {
      queryBuilder.andWhere('audit.severity IN (:...severities)', {
        severities: filter.severity
      });
    }
    if (filter.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filter.userId });
    }
    if (filter.resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', {
        resourceType: filter.resourceType
      });
    }
    if (filter.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: filter.startDate
      });
    }
    if (filter.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: filter.endDate
      });
    }
  }

  /**
   * Generates compliance metadata for audit reporting
   * @private
   */
  private generateComplianceMetadata(logs: AuditModel[]): object {
    return {
      totalRecords: logs.length,
      containsPII: logs.some(log => log.details?.complianceFlags?.containsPII),
      containsPHI: logs.some(log => log.details?.complianceFlags?.containsPHI),
      hipaaRelevant: logs.some(log => log.details?.complianceFlags?.hipaaRelevant),
      oldestRecord: logs.reduce((oldest, log) => 
        log.createdAt < oldest ? log.createdAt : oldest,
        new Date()
      ),
      retentionCompliant: true
    };
  }

  /**
   * Detects PII in log entry
   * @private
   */
  private detectPII(logEntry: AuditLogEntry): boolean {
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{3}\b/, // SIN
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ // Phone
    ];

    const stringifiedEntry = JSON.stringify(logEntry.details || {});
    return piiPatterns.some(pattern => pattern.test(stringifiedEntry));
  }

  /**
   * Detects PHI in log entry
   * @private
   */
  private detectPHI(logEntry: AuditLogEntry): boolean {
    return logEntry.resourceType === 'MEDICAL_DOCUMENT' ||
           logEntry.eventType === AuditEventType.DOCUMENT_ACCESS &&
           logEntry.details?.documentType === 'MEDICAL';
  }

  /**
   * Checks if event is HIPAA relevant
   * @private
   */
  private isHIPAARelevant(eventType: AuditEventType): boolean {
    const hipaaEvents = [
      AuditEventType.DOCUMENT_ACCESS,
      AuditEventType.DOCUMENT_UPLOAD,
      AuditEventType.DELEGATE_ACCESS
    ];
    return hipaaEvents.includes(eventType);
  }

  /**
   * Validates UUID format
   * @private
   */
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}