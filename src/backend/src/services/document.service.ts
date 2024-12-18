/**
 * Enhanced Document Service for Estate Kit
 * Implements secure document management with versioning, encryption, and compliance features
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Retry } from 'typescript-retry-decorator';
import { compress } from 'compression';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import {
  Document,
  DocumentStatus,
  CreateDocumentDTO,
  DocumentMetadata,
  EncryptionType
} from '../types/document.types';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger.util';
import { ResourceType, AccessLevel } from '../types/permission.types';

// Constants for security and compliance
const ENCRYPTION_KEY_ROTATION_DAYS = 90;
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

@Injectable()
export class DocumentService {
  private readonly s3Client: S3Client;

  constructor(
    @InjectRepository('Document')
    private readonly documentRepository: Repository<Document>,
    private readonly auditService: AuditService,
    private readonly encryptionService: EncryptionService
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ca-central-1'
    });
  }

  /**
   * Creates a new document version with enhanced security and compliance features
   * @param documentId - ID of the document
   * @param versionData - Data for the new version
   * @param userId - ID of the user creating the version
   * @returns Promise<Document>
   */
  @Retry({
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000
  })
  async createDocumentVersion(
    documentId: string,
    versionData: CreateDocumentDTO,
    userId: string
  ): Promise<Document> {
    try {
      // Validate access permissions
      await this.validateUserAccess(userId, documentId, AccessLevel.WRITE);

      // Create metadata with required fields
      const completeMetadata: DocumentMetadata = {
        ...versionData.metadata,
        uploadedAt: new Date(),
        lastModified: new Date()
      };

      // Validate file metadata
      this.validateFileMetadata(completeMetadata);

      // Compress document content
      const compressedContent = await this.compressDocument(versionData.file);

      // Generate new encryption key and encrypt content
      const encryptedData = await this.encryptionService.encryptWithNewKey(
        compressedContent,
        {
          keyRotationDays: ENCRYPTION_KEY_ROTATION_DAYS,
          algorithm: 'AES-256-GCM'
        }
      );

      // Create S3 storage path with versioning
      const s3Key = this.generateS3Key(documentId, userId);
      
      // Upload to S3 with server-side encryption
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: encryptedData.content,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: process.env.KMS_KEY_ID,
        Metadata: {
          'x-amz-meta-encryption-key-id': encryptedData.keyId,
          'x-amz-meta-user-id': userId,
          'x-amz-meta-document-type': versionData.type
        }
      });

      const uploadResult = await this.s3Client.send(uploadCommand);

      // Create version record
      const version = {
        documentId,
        versionNumber: await this.getNextVersionNumber(documentId),
        storageDetails: {
          bucket: process.env.S3_BUCKET_NAME,
          key: s3Key,
          version: uploadResult.VersionId,
          encryptionType: EncryptionType.KMS_MANAGED,
          kmsKeyId: process.env.KMS_KEY_ID
        },
        metadata: {
          ...completeMetadata,
          fileName: this.sanitizeFileName(completeMetadata.fileName),
          fileSize: compressedContent.length,
          geographicLocation: 'ca-central-1'
        },
        status: DocumentStatus.COMPLETED,
        createdAt: new Date(),
        createdBy: userId
      };

      // Save version to database
      const savedVersion = await this.documentRepository.save(version);

      // Log audit trail
      await this.auditService.createAuditLog({
        eventType: 'DOCUMENT_VERSION_CREATED',
        severity: 'NORMAL',
        userId,
        resourceId: documentId,
        resourceType: ResourceType.LEGAL_DOCS,
        ipAddress: '0.0.0.0',
        userAgent: 'system',
        details: {
          versionNumber: version.versionNumber,
          documentType: versionData.type,
          fileName: version.metadata.fileName
        }
      });

      return savedVersion;
    } catch (error) {
      logger.error('Failed to create document version', {
        error,
        documentId,
        userId
      });
      throw error;
    }
  }

  /**
   * Enforces document retention policies and handles document lifecycle
   * @param documentId - ID of the document to check
   */
  async enforceRetentionPolicy(documentId: string): Promise<void> {
    try {
      const document = await this.documentRepository.findOne({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const retentionPolicy = await this.getDocumentRetentionPolicy();
      const documentAge = this.calculateDocumentAge(document.metadata.uploadedAt);

      if (documentAge > retentionPolicy.retentionPeriod) {
        await this.handleRetention(document, retentionPolicy.action);

        // Log retention action
        await this.auditService.createAuditLog({
          eventType: 'RETENTION_POLICY_ENFORCED',
          severity: 'NORMAL',
          userId: 'system',
          resourceId: documentId,
          resourceType: ResourceType.LEGAL_DOCS,
          ipAddress: '0.0.0.0',
          userAgent: 'system',
          details: {
            action: retentionPolicy.action,
            documentAge,
            retentionPeriod: retentionPolicy.retentionPeriod
          }
        });
      }
    } catch (error) {
      logger.error('Failed to enforce retention policy', {
        error,
        documentId
      });
      throw error;
    }
  }

  // Private helper methods
  private async validateUserAccess(
    userId: string,
    documentId: string,
    requiredLevel: AccessLevel
  ): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const hasAccess = await this.encryptionService.validateAccess(userId, document.type, requiredLevel);
    
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }
  }

  private validateFileMetadata(metadata: DocumentMetadata): void {
    if (!ALLOWED_MIME_TYPES.includes(metadata.mimeType)) {
      throw new Error('Invalid file type');
    }

    if (metadata.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error('File size exceeds maximum limit');
    }
  }

  private async compressDocument(content: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      compress(content, {
        level: 6
      }, (err: Error | null, result: Buffer) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  private generateS3Key(documentId: string, userId: string): string {
    return `documents/${userId}/${documentId}/${Date.now()}`;
  }

  private async getNextVersionNumber(documentId: string): Promise<number> {
    const versions = await this.documentRepository.find({
      where: { id: documentId },
      order: { createdAt: 'DESC' },
      take: 1
    });

    return versions.length ? (versions[0].version || 0) + 1 : 1;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  private async getDocumentRetentionPolicy(): Promise<{ retentionPeriod: number; action: string }> {
    return {
      retentionPeriod: 730, // 2 years
      action: 'ARCHIVE'
    };
  }

  private calculateDocumentAge(uploadDate: Date): number {
    const ageInMs = Date.now() - uploadDate.getTime();
    return Math.floor(ageInMs / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private async handleRetention(document: Document, action: string): Promise<void> {
    if (action === 'ARCHIVE') {
      await this.encryptionService.archiveDocument(document.id);
    } else if (action === 'DELETE') {
      await this.encryptionService.deleteDocument(document.id);
    }
  }
}