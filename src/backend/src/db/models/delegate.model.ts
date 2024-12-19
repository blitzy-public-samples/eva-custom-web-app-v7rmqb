/**
 * TypeORM entity model for delegate relationships in Estate Kit platform.
 * Implements enhanced security features including field-level encryption,
 * audit logging, and strict temporal access controls.
 * @version 1.0.0
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad
} from 'typeorm'; // ^0.3.0

import { DelegateStatus } from '../../types/delegate.types';
import { UserRole } from '../../types/user.types';
import UserModel from './user.model';
import { EncryptionService } from '../../services/encryption.service';
import { AuditService } from '../../services/audit.service';
import { randomBytes } from 'crypto';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

// Initialize services
const encryptionService = new EncryptionService();
const auditService = new AuditService({
  auditRepository: null // This will be injected by the DI container
});

@Entity('delegates')
@Index(['ownerId'])
@Index(['delegateId'])
@Index(['status'])
@Index(['role'])
export class DelegateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  ownerId!: string;

  @Column({ type: 'uuid', nullable: false })
  delegateId!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: DelegateStatus,
    default: DelegateStatus.PENDING
  })
  status!: DelegateStatus;

  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    comment: 'Delegate access expiration date'
  })
  expiresAt!: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Encrypted delegate-specific data'
  })
  encryptedData!: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
    comment: 'Unique access key for delegate'
  })
  accessKey!: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Record creation timestamp'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Record update timestamp'
  })
  updatedAt!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Last successful access timestamp'
  })
  lastAccessedAt!: Date | null;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Number of successful access attempts'
  })
  accessCount!: number;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  owner!: UserModel;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  delegate!: UserModel;

  /**
   * Creates a new delegate entity with enhanced security features
   */
  constructor(delegateData?: Partial<DelegateEntity>) {
    if (delegateData) {
      Object.assign(this, delegateData);
      
      // Set default status if not provided
      if (!this.status) {
        this.status = DelegateStatus.PENDING;
      }

      // Validate expiration date
      if (this.expiresAt && new Date(this.expiresAt) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }

      // Generate unique access key
      this.accessKey = randomBytes(32).toString('hex');
    }
  }

  /**
   * Transforms entity for JSON serialization with data masking
   */
  toJSON(): Record<string, any> {
    const {
      id,
      ownerId,
      delegateId,
      role,
      status,
      expiresAt,
      lastAccessedAt,
      accessCount,
      createdAt,
      updatedAt
    } = this;

    return {
      id,
      ownerId,
      delegateId,
      role,
      status,
      expiresAt: expiresAt?.toISOString(),
      lastAccessedAt: lastAccessedAt?.toISOString(),
      accessCount,
      createdAt: createdAt?.toISOString(),
      updatedAt: updatedAt?.toISOString()
    };
  }

  /**
   * Checks if delegate access is currently active
   */
  async isActive(): Promise<boolean> {
    // Check basic status
    if (this.status !== DelegateStatus.ACTIVE) {
      return false;
    }

    // Check expiration
    if (new Date() >= this.expiresAt) {
      this.status = DelegateStatus.EXPIRED;
      return false;
    }

    // Update access tracking
    this.lastAccessedAt = new Date();
    this.accessCount++;

    // Log access attempt
    await auditService.createAuditLog({
      eventType: AuditEventType.DELEGATE_ACCESS,
      severity: AuditSeverity.INFO,
      userId: this.delegateId,
      resourceId: this.id,
      resourceType: 'DELEGATE',
      ipAddress: '0.0.0.0', // Should be passed from the request context
      userAgent: 'system',
      details: {
        accessType: 'ACCESS_CHECK',
        success: true
      }
    });

    return true;
  }

  /**
   * Pre-insert validation and encryption
   */
  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    // Validate required fields
    if (!this.ownerId || !this.delegateId || !this.role || !this.expiresAt) {
      throw new Error('Missing required delegate fields');
    }

    // Encrypt sensitive data if present
    if (this.encryptedData) {
      const encrypted = await encryptionService.encryptField(
        Buffer.from(this.encryptedData),
        this.accessKey
      );
      this.encryptedData = encrypted.content.toString('base64');
    }

    // Set initial timestamps
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * Pre-update validation and encryption
   */
  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    // Re-encrypt data if modified
    if (this.encryptedData) {
      const encrypted = await encryptionService.encryptField(
        Buffer.from(this.encryptedData),
        this.accessKey
      );
      this.encryptedData = encrypted.content.toString('base64');
    }

    // Update timestamp
    this.updatedAt = new Date();

    // Log update
    await auditService.createAuditLog({
      eventType: AuditEventType.DELEGATE_ACCESS,
      severity: AuditSeverity.INFO,
      userId: this.delegateId,
      resourceId: this.id,
      resourceType: 'DELEGATE',
      ipAddress: '0.0.0.0', // Should be passed from the request context
      userAgent: 'system',
      details: {
        accessType: 'UPDATE',
        success: true
      }
    });
  }

  /**
   * Post-load decryption
   */
  @AfterLoad()
  async afterLoad(): Promise<void> {
    // Decrypt sensitive data
    if (this.encryptedData) {
      try {
        const decrypted = await encryptionService.decryptField(
          {
            content: Buffer.from(this.encryptedData, 'base64'),
            iv: Buffer.alloc(16),
            authTag: Buffer.alloc(16),
            keyVersion: '1',
            metadata: {
              algorithm: 'aes-256-gcm',
              timestamp: Date.now()
            }
          },
          this.accessKey
        );
        this.encryptedData = decrypted.toString();
      } catch (error) {
        this.encryptedData = '';
        throw new Error('Failed to decrypt delegate data');
      }
    }
  }
}