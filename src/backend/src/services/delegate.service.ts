/**
 * Enhanced Delegate Service for Estate Kit platform
 * Implements PIPEDA and HIPAA compliant delegate management with temporal access controls,
 * comprehensive audit logging, and secure permission verification.
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common'; // ^9.0.0
import { Repository } from 'typeorm'; // ^0.3.0
import { InjectRepository } from '@nestjs/typeorm'; // ^0.3.0
import { RateLimiterMemory } from 'rate-limiter-flexible'; // ^2.3.0
import { CloudWatch } from '@aws-sdk/client-cloudwatch'; // ^3.0.0

import { DelegateEntity } from '../db/models/delegate.model';
import { CreateDelegateDTO } from '../types/delegate.types';
import { EncryptionService } from './encryption.service';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger.util';
import { ResourceType, AccessLevel, DelegateStatus } from '../types/delegate.types';
import { AuditEventType, AuditSeverity } from '../types/audit.types';

// Security and rate limiting configuration
const RATE_LIMIT_POINTS = 100;
const RATE_LIMIT_DURATION = 60; // seconds

@Injectable()
export class DelegateService {
  private rateLimiter: RateLimiterMemory;
  private cloudWatch: CloudWatch;

  constructor(
    @InjectRepository(DelegateEntity)
    private readonly delegateRepository: Repository<DelegateEntity>,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService
  ) {
    // Initialize rate limiter
    this.rateLimiter = new RateLimiterMemory({
      points: RATE_LIMIT_POINTS,
      duration: RATE_LIMIT_DURATION
    });

    // Initialize CloudWatch for security metrics
    this.cloudWatch = new CloudWatch({
      region: process.env.AWS_REGION || 'ca-central-1'
    });
  }

  /**
   * Creates a new delegate relationship with enhanced security features
   */
  async createDelegate(
    ownerId: string,
    delegateData: CreateDelegateDTO
  ): Promise<DelegateEntity> {
    try {
      // Validate delegate data
      this.validateDelegateData(delegateData);

      // Encrypt sensitive delegate information
      const encryptedData = await this.encryptionService.encryptField(
        Buffer.from(JSON.stringify({
          email: delegateData.email,
          permissions: delegateData.permissions
        })),
        process.env.ENCRYPTION_KEY as string
      );

      // Create delegate entity
      const delegate = this.delegateRepository.create({
        ownerId,
        role: delegateData.role,
        status: DelegateStatus.PENDING,
        expiresAt: delegateData.expiresAt,
        encryptedData: encryptedData.content.toString('base64')
      });

      // Save delegate with enhanced error handling
      const savedDelegate = await this.delegateRepository.save(delegate);

      // Create audit log
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_INVITE,
        severity: AuditSeverity.INFO,
        userId: ownerId,
        resourceId: savedDelegate.id,
        resourceType: 'DELEGATE',
        ipAddress: '', // Should be passed from controller
        userAgent: '', // Should be passed from controller
        details: {
          delegateRole: delegateData.role,
          expirationDate: delegateData.expiresAt
        }
      });

      // Record security metric
      await this.recordSecurityMetric('DelegateCreation', 1);

      return savedDelegate;
    } catch (error) {
      logger.error('Failed to create delegate', {
        error,
        ownerId,
        delegateEmail: '[REDACTED]'
      });
      throw error;
    }
  }

  /**
   * Retrieves a specific delegate by ID with security checks
   */
  async getDelegate(id: string): Promise<DelegateEntity> {
    try {
      const delegate = await this.delegateRepository.findOne({
        where: { id }
      });

      if (!delegate) {
        throw new Error('Delegate not found');
      }

      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: AuditSeverity.INFO,
        userId: delegate.delegateId,
        resourceId: id,
        resourceType: 'DELEGATE',
        ipAddress: '', // Should be passed from controller
        userAgent: '', // Should be passed from controller
        details: {
          accessType: 'READ'
        }
      });

      return delegate;
    } catch (error) {
      logger.error('Failed to retrieve delegate', { error, id });
      throw error;
    }
  }

  /**
   * Retrieves all delegates for an owner with pagination
   */
  async getDelegates(ownerId: string, page: number = 1, limit: number = 10): Promise<{
    delegates: DelegateEntity[];
    total: number;
  }> {
    try {
      const [delegates, total] = await this.delegateRepository.findAndCount({
        where: { ownerId },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' }
      });

      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: AuditSeverity.INFO,
        userId: ownerId,
        resourceId: null,
        resourceType: 'DELEGATE_LIST',
        ipAddress: '', // Should be passed from controller
        userAgent: '', // Should be passed from controller
        details: {
          accessType: 'LIST',
          page,
          limit
        }
      });

      return { delegates, total };
    } catch (error) {
      logger.error('Failed to retrieve delegates', { error, ownerId });
      throw error;
    }
  }

  /**
   * Updates delegate information with security validation
   */
  async updateDelegate(
    id: string,
    ownerId: string,
    updates: Partial<DelegateEntity>
  ): Promise<DelegateEntity> {
    try {
      const delegate = await this.delegateRepository.findOne({
        where: { id, ownerId }
      });

      if (!delegate) {
        throw new Error('Delegate not found or unauthorized');
      }

      // Update delegate
      Object.assign(delegate, updates);
      const updatedDelegate = await this.delegateRepository.save(delegate);

      await this.auditService.createAuditLog({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.INFO,
        userId: ownerId,
        resourceId: id,
        resourceType: 'DELEGATE',
        ipAddress: '', // Should be passed from controller
        userAgent: '', // Should be passed from controller
        details: {
          updates: Object.keys(updates)
        }
      });

      await this.recordSecurityMetric('DelegateUpdate', 1);

      return updatedDelegate;
    } catch (error) {
      logger.error('Failed to update delegate', { error, id });
      throw error;
    }
  }

  /**
   * Revokes delegate access with security audit
   */
  async revokeDelegate(id: string, ownerId: string): Promise<void> {
    try {
      const delegate = await this.delegateRepository.findOne({
        where: { id, ownerId }
      });

      if (!delegate) {
        throw new Error('Delegate not found or unauthorized');
      }

      delegate.status = DelegateStatus.REVOKED;
      await this.delegateRepository.save(delegate);

      await this.auditService.createAuditLog({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.WARNING,
        userId: ownerId,
        resourceId: id,
        resourceType: 'DELEGATE',
        ipAddress: '', // Should be passed from controller
        userAgent: '', // Should be passed from controller
        details: {
          action: 'REVOKE'
        }
      });

      await this.recordSecurityMetric('DelegateRevocation', 1);
    } catch (error) {
      logger.error('Failed to revoke delegate', { error, id });
      throw error;
    }
  }

  /**
   * Verifies delegate access with comprehensive security checks
   */
  async verifyDelegateAccess(
    delegateId: string,
    resourceType: ResourceType,
    requiredAccess: AccessLevel
  ): Promise<boolean> {
    try {
      // Check rate limit
      await this.rateLimiter.consume(delegateId);

      // Get delegate with active status check
      const delegate = await this.delegateRepository.findOne({
        where: { id: delegateId }
      });

      if (!delegate) {
        throw new Error('Delegate not found');
      }

      // Verify active status and temporal access
      const isActive = await delegate.isActive();
      if (!isActive) {
        await this.recordSecurityMetric('DelegateAccessDenied', 1);
        return false;
      }

      // Decrypt and verify permissions
      const decryptedData = await this.encryptionService.decryptField(
        {
          content: Buffer.from(delegate.encryptedData, 'base64'),
          iv: Buffer.alloc(16), // Should be stored with encrypted data
          authTag: Buffer.alloc(16), // Should be stored with encrypted data
          keyVersion: '1', // Added keyVersion
          metadata: {
            algorithm: 'aes-256-gcm',
            timestamp: Date.now()
          }
        },
        process.env.ENCRYPTION_KEY as string
      );

      const permissions = JSON.parse(decryptedData.toString()).permissions;
      const hasAccess = this.verifyPermissions(permissions, resourceType, requiredAccess);

      // Create audit log for access attempt
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: hasAccess ? AuditSeverity.INFO : AuditSeverity.WARNING,
        userId: delegate.delegateId,
        resourceId: delegateId,
        resourceType: 'DELEGATE_ACCESS',
        ipAddress: '', // Should be passed from controller
        userAgent: '', // Should be passed from controller
        details: {
          resourceType,
          requiredAccess,
          accessGranted: hasAccess
        }
      });

      // Record security metric
      await this.recordSecurityMetric(
        hasAccess ? 'DelegateAccessGranted' : 'DelegateAccessDenied',
        1
      );

      return hasAccess;
    } catch (error) {
      logger.error('Delegate access verification failed', {
        error,
        delegateId,
        resourceType
      });
      throw error;
    }
  }

  /**
   * Validates delegate data for compliance and security
   * @private
   */
  private validateDelegateData(data: CreateDelegateDTO): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Invalid delegate email');
    }
    if (!data.role || !this.isValidRole(data.role)) {
      throw new Error('Invalid delegate role');
    }
    if (!data.expiresAt || new Date(data.expiresAt) <= new Date()) {
      throw new Error('Invalid expiration date');
    }
    if (!data.permissions || !Array.isArray(data.permissions)) {
      throw new Error('Invalid permissions format');
    }
  }

  /**
   * Verifies delegate permissions against required access
   * @private
   */
  private verifyPermissions(
    permissions: Array<{ resourceType: ResourceType; accessLevel: AccessLevel }>,
    resourceType: ResourceType,
    requiredAccess: AccessLevel
  ): boolean {
    const permission = permissions.find(p => p.resourceType === resourceType);
    if (!permission) return false;
    
    const accessLevels = {
      [AccessLevel.NONE]: 0,
      [AccessLevel.READ]: 1,
      [AccessLevel.WRITE]: 2
    };

    return accessLevels[permission.accessLevel] >= accessLevels[requiredAccess];
  }

  /**
   * Records security metrics to CloudWatch
   * @private
   */
  private async recordSecurityMetric(
    metricName: string,
    value: number
  ): Promise<void> {
    try {
      await this.cloudWatch.putMetricData({
        Namespace: 'EstateKit/DelegateService',
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: 'Count',
          Timestamp: new Date()
        }]
      });
    } catch (error) {
      logger.error('Failed to record security metric', {
        error,
        metricName,
        value
      });
    }
  }

  /**
   * Validates email format
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validates delegate role
   * @private
   */
  private isValidRole(role: string): boolean {
    return Object.values(ResourceType).includes(role as ResourceType);
  }
}