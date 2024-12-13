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

import { UserRole, DelegateStatus } from '../../../types/delegate.types';
import { UserModel } from './user.model';
import { EncryptionService } from '../services/encryption.service';
import { AuditLogger } from '../services/audit.service';

// Initialize services
const encryptionService = new EncryptionService();
const auditLogger = new AuditLogger();

@Entity('delegates')
@Index(['ownerId'])
@Index(['delegateId'])
@Index(['status'])
@Index(['role'])
export class DelegateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  ownerId: string;

  @Column({ type: 'uuid', nullable: false })
  delegateId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: DelegateStatus,
    default: DelegateStatus.PENDING
  })
  status: DelegateStatus;

  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    comment: 'Delegate access expiration date'
  })
  expiresAt: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Encrypted delegate-specific data'
  })
  encryptedData: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
    comment: 'Unique access key for delegate'
  })
  accessKey: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Record creation timestamp'
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Record update timestamp'
  })
  updatedAt: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Last successful access timestamp'
  })
  lastAccessedAt: Date | null;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Number of successful access attempts'
  })
  accessCount: number;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  owner: UserModel;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  delegate: UserModel;

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
      this.accessKey = crypto.randomBytes(32).toString('hex');
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
    await auditLogger.logDelegateAccess({
      delegateId: this.id,
      accessType: 'ACCESS_CHECK',
      success: true
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
        this.encryptedData,
        this.accessKey
      );
      this.encryptedData = encrypted;
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
        this.encryptedData,
        this.accessKey
      );
      this.encryptedData = encrypted;
    }

    // Update timestamp
    this.updatedAt = new Date();

    // Log update
    await auditLogger.logDelegateAccess({
      delegateId: this.id,
      accessType: 'UPDATE',
      success: true
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
          this.encryptedData,
          this.accessKey
        );
        this.encryptedData = decrypted;
      } catch (error) {
        this.encryptedData = null;
        throw new Error('Failed to decrypt delegate data');
      }
    }
  }
}