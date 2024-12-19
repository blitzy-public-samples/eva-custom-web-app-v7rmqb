// @ts-check
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm'; // ^0.3.0

import {
  DocumentType,
  DocumentStatus,
  DocumentMetadata
} from '../../types/document.types';

import UserModel from './user.model';
import { EncryptionService } from '../../services/encryption.service';
import crypto from 'crypto';

// Initialize encryption service for document content encryption
const encryptionService = new EncryptionService();

/**
 * TypeORM entity model for document management in Estate Kit platform.
 * Implements PIPEDA-compliant document storage with enhanced security features.
 */
@Entity('documents')
@Index(['userId', 'type', 'status'])
@Index(['createdAt'])
@Index(['userId', 'createdAt'])
@Index(['type', 'status'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: false 
  })
  title!: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    nullable: false
  })
  type!: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING
  })
  status!: DocumentStatus;

  @Column({
    type: 'jsonb',
    nullable: false
  })
  metadata!: DocumentMetadata;

  @Column({
    type: 'jsonb',
    nullable: false,
    comment: 'Encrypted storage details for document content'
  })
  encryptedStorageDetails!: {
    bucket: string;
    key: string;
    version: string;
    encryptionType: string;
    kmsKeyId: string;
  };

  @Column({
    type: 'jsonb',
    nullable: false,
    default: [],
    comment: 'Audit trail for document operations'
  })
  auditLog!: Array<{
    timestamp: Date;
    operation: string;
    userId: string;
    details: Record<string, any>;
  }>;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Document version identifier'
  })
  version!: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
    comment: 'SHA-256 checksum of document content'
  })
  checksum!: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indicates if document content is encrypted'
  })
  isEncrypted!: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    comment: 'Document retention expiration date'
  })
  retentionDate!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Last document access timestamp'
  })
  lastAccessedAt!: Date;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Document creation timestamp'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Last update timestamp'
  })
  updatedAt!: Date;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  user!: UserModel;

  /**
   * Creates a new document instance with enhanced security initialization
   * @param data - Partial document data for initialization
   */
  constructor(data?: Partial<Document>) {
    if (data) {
      Object.assign(this, data);
    }

    // Set default status if not provided
    this.status = this.status || DocumentStatus.PENDING;

    // Initialize metadata if not provided
    if (!this.metadata) {
      this.metadata = {
        fileName: '',
        fileSize: 0,
        mimeType: '',
        uploadedAt: new Date(),
        lastModified: new Date(),
        retentionPeriod: 365, // Default 1-year retention
        geographicLocation: process.env.AWS_REGION || 'ca-central-1'
      };
    }

    // Initialize encrypted storage details if not provided
    if (!this.encryptedStorageDetails) {
      this.encryptedStorageDetails = {
        bucket: process.env.AWS_S3_BUCKET || '',
        key: '',
        version: '1',
        encryptionType: 'AES_256',
        kmsKeyId: process.env.AWS_KMS_KEY_ID || ''
      };
    }

    // Initialize version
    this.version = this.version || `v1_${Date.now()}`;

    // Initialize audit log
    this.auditLog = this.auditLog || [];

    // Set retention date if not provided
    if (!this.retentionDate) {
      const retentionDays = this.metadata?.retentionPeriod || 365;
      this.retentionDate = new Date();
      this.retentionDate.setDate(this.retentionDate.getDate() + retentionDays);
    }
  }

  /**
   * Encrypts storage details before saving to database
   * Implements secure storage with AWS KMS integration
   */
  @BeforeInsert()
  @BeforeUpdate()
  async encryptStorageDetails(): Promise<void> {
    if (!this.isEncrypted || !this.encryptedStorageDetails) {
      return;
    }

    try {
      // Encrypt storage details
      const encryptedData = await encryptionService.encryptField(
        Buffer.from(JSON.stringify(this.encryptedStorageDetails)),
        process.env.ENCRYPTION_KEY as string
      );

      // Update storage details with encrypted data
      this.encryptedStorageDetails = {
        ...this.encryptedStorageDetails,
        key: encryptedData.content.toString('base64'),
        version: encryptedData.keyVersion
      };

      // Update checksum
      this.checksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(this.encryptedStorageDetails))
        .digest('hex');

      // Log encryption operation
      this.updateAuditLog('ENCRYPT_STORAGE', this.userId, {
        version: this.version,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to encrypt storage details: ${errorMessage}`);
    }
  }

  /**
   * Updates the audit log with document operations
   * Implements comprehensive audit trail for compliance
   * @param operation - Operation being performed
   * @param userId - User performing the operation
   * @param details - Additional operation details
   */
  updateAuditLog(
    operation: string,
    userId: string,
    details: Record<string, any>
  ): void {
    this.auditLog.push({
      timestamp: new Date(),
      operation,
      userId,
      details: {
        ...details,
        documentVersion: this.version,
        documentType: this.type
      }
    });
  }

  /**
   * Converts document entity to JSON representation
   * Implements secure data exposure controls
   */
  toJSON(): Record<string, any> {
    const {
      id,
      userId,
      title,
      type,
      status,
      metadata,
      version,
      isEncrypted,
      retentionDate,
      lastAccessedAt,
      createdAt,
      updatedAt
    } = this;

    // Create a new metadata object without geographicLocation
    const sanitizedMetadata = {
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      uploadedAt: metadata.uploadedAt,
      lastModified: metadata.lastModified,
      retentionPeriod: metadata.retentionPeriod
    };

    return {
      id,
      userId,
      title,
      type,
      status,
      metadata: sanitizedMetadata,
      version,
      isEncrypted,
      retentionDate: retentionDate.toISOString(),
      lastAccessedAt: lastAccessedAt?.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    };
  }
}

export default Document;