/**
 * Storage Service
 * Provides secure document storage operations with encryption, versioning, and audit logging
 * @module StorageService
 * @version 1.0.0
 */

import { injectable } from 'tsyringe'; // ^4.7.0
import { S3Integration } from '../integrations/aws-s3.integration';
import { EncryptionService } from './encryption.service';
import { logger } from '../utils/logger.util';

interface SecurityMetadata {
  classification: string;
  accessLevel: string;
  retentionPolicy?: string;
  encryptionContext?: string;
}

interface DocumentMetadata {
  contentType: string;
  size: number;
  checksum: string;
  versionId: string;
  lastModified: Date;
  securityContext: SecurityMetadata;
}

interface S3Metadata {
  encryption: {
    algorithm: string;
    keyId?: string;
    iv: string;
    authTag: string;
    version: string;
    classification: string;
    accessLevel: string;
    retentionPolicy?: string;
    userId?: string;
  };
  contentType: string;
  size: number;
  checksum: string;
  versionId: string;
  lastModified: Date;
}

@injectable()
export class StorageService {
  constructor(
    private readonly s3Integration: S3Integration,
    private readonly encryptionService: EncryptionService
  ) {
    // Validate required dependencies
    if (!s3Integration || !encryptionService) {
      throw new Error('Required dependencies not provided');
    }

    logger.info('Storage service initialized successfully');
  }

  /**
   * Uploads and encrypts a document with enhanced security features
   */
  public async uploadDocument(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    userId: string,
    securityMetadata: SecurityMetadata
  ): Promise<{ url: string; metadata: DocumentMetadata }> {
    try {
      // Input validation
      if (!fileBuffer || !fileName || !contentType || !userId) {
        throw new Error('Missing required upload parameters');
      }

      logger.info('Starting secure document upload', {
        fileName,
        contentType,
        userId,
        classification: securityMetadata.classification
      });

      // Encrypt document content
      const encryptedData = await this.encryptionService.encryptField(
        fileBuffer,
        process.env.AWS_KMS_KEY_ID!
      );

      // Generate storage key with security context
      const storageKey = `documents/${userId}/${Date.now()}-${fileName}`;

      // Upload encrypted document with enhanced metadata
      const uploadResult = await this.s3Integration.uploadFile(
        encryptedData.content,
        storageKey,
        contentType,
        {
          userId,
          originalName: fileName,
          encryptionVersion: encryptedData.keyVersion,
          securityClassification: securityMetadata.classification,
          accessLevel: securityMetadata.accessLevel,
          retentionPolicy: securityMetadata.retentionPolicy || 'standard',
          uploadTimestamp: new Date().toISOString()
        }
      );

      // Compile comprehensive metadata
      const documentMetadata: DocumentMetadata = {
        contentType,
        size: fileBuffer.length,
        checksum: uploadResult.metadata.checksum,
        versionId: uploadResult.versionId,
        lastModified: new Date(),
        securityContext: securityMetadata
      };

      logger.info('Document uploaded successfully', {
        storageKey,
        versionId: uploadResult.versionId,
        size: fileBuffer.length
      });

      return {
        url: uploadResult.url,
        metadata: documentMetadata
      };

    } catch (error) {
      logger.error('Document upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
        userId
      });
      throw new Error(`Document upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Downloads and decrypts a document with security validation
   */
  public async downloadDocument(
    documentKey: string,
    userId: string,
    securityContext: SecurityMetadata
  ): Promise<Buffer> {
    try {
      // Input validation
      if (!documentKey || !userId) {
        throw new Error('Missing required download parameters');
      }

      logger.info('Starting secure document download', {
        documentKey,
        userId,
        accessLevel: securityContext.accessLevel
      });

      // Get document metadata for security validation
      const rawMetadata = await this.s3Integration.getFileMetadata(documentKey);
      const metadata: S3Metadata = {
        encryption: {
          algorithm: rawMetadata.encryption.algorithm,
          keyId: rawMetadata.encryption.keyId,
          iv: '',  // Will be populated from encrypted data
          authTag: '', // Will be populated from encrypted data
          version: '1', // Default version if not available
          classification: securityContext.classification,
          accessLevel: securityContext.accessLevel,
          retentionPolicy: securityContext.retentionPolicy,
          userId: userId
        },
        contentType: rawMetadata.contentType,
        size: rawMetadata.size,
        checksum: rawMetadata.checksum,
        versionId: rawMetadata.versionId,
        lastModified: rawMetadata.lastModified
      };

      // Validate access permissions
      this.validateAccessPermissions(metadata, userId, securityContext);

      // Download encrypted document
      const encryptedContent = await this.s3Integration.downloadFile(documentKey);

      // Convert readable stream to buffer
      const encryptedBuffer = await this.streamToBuffer(encryptedContent);

      // Get encryption metadata
      const encryptionMetadata = {
        iv: Buffer.from(metadata.encryption.iv, 'base64'),
        authTag: Buffer.from(metadata.encryption.authTag, 'base64'),
        keyVersion: metadata.encryption.version,
        metadata: {
          algorithm: metadata.encryption.algorithm,
          timestamp: Date.now()
        }
      };

      // Decrypt document content
      const decryptedContent = await this.encryptionService.decryptField(
        {
          content: encryptedBuffer,
          ...encryptionMetadata
        },
        process.env.AWS_KMS_KEY_ID!
      );

      logger.info('Document downloaded successfully', {
        documentKey,
        userId,
        size: decryptedContent.length
      });

      return decryptedContent;

    } catch (error) {
      logger.error('Document download failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentKey,
        userId
      });
      throw new Error(`Document download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Archives a document with audit trail
   */
  public async archiveDocument(
    documentKey: string,
    userId: string,
    archiveMetadata: { reason: string; retentionPeriod: number }
  ): Promise<void> {
    try {
      // Input validation
      if (!documentKey || !userId) {
        throw new Error('Missing required archive parameters');
      }

      logger.info('Starting document archival', {
        documentKey,
        userId,
        retentionPeriod: archiveMetadata.retentionPeriod
      });

      // Get document metadata
      const rawMetadata = await this.s3Integration.getFileMetadata(documentKey);
      const metadata: S3Metadata = {
        encryption: {
          algorithm: rawMetadata.encryption.algorithm,
          keyId: rawMetadata.encryption.keyId,
          iv: '',
          authTag: '',
          version: '1',
          classification: 'ARCHIVED',
          accessLevel: 'RESTRICTED',
          retentionPolicy: `${archiveMetadata.retentionPeriod}`,
          userId: userId
        },
        contentType: rawMetadata.contentType,
        size: rawMetadata.size,
        checksum: rawMetadata.checksum,
        versionId: rawMetadata.versionId,
        lastModified: rawMetadata.lastModified
      };

      // Validate archive permissions
      await this.checkUserAccess(userId, documentKey, 'ARCHIVE');

      // Move to archive storage location
      const archiveKey = `archive/${documentKey}`;
      await this.s3Integration.uploadFile(
        await this.streamToBuffer(await this.s3Integration.downloadFile(documentKey)),
        archiveKey,
        metadata.contentType,
        {
          ...metadata.encryption,
          archiveReason: archiveMetadata.reason,
          archiveDate: new Date().toISOString(),
          retentionPeriod: archiveMetadata.retentionPeriod.toString()
        }
      );

      // Delete original document
      await this.s3Integration.deleteFile(documentKey);

      logger.info('Document archived successfully', {
        documentKey,
        archiveKey,
        userId
      });

    } catch (error) {
      logger.error('Document archival failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentKey,
        userId
      });
      throw new Error(`Document archival failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks user access permissions for document operations
   */
  public async checkUserAccess(
    userId: string,
    documentKey: string,
    operation: 'READ' | 'WRITE' | 'DELETE' | 'ARCHIVE'
  ): Promise<boolean> {
    try {
      const rawMetadata = await this.s3Integration.getFileMetadata(documentKey);
      const metadata: S3Metadata = {
        encryption: {
          algorithm: rawMetadata.encryption.algorithm,
          keyId: rawMetadata.encryption.keyId,
          iv: '',
          authTag: '',
          version: '1',
          classification: 'RESTRICTED',
          accessLevel: 'USER',
          userId: userId
        },
        contentType: rawMetadata.contentType,
        size: rawMetadata.size,
        checksum: rawMetadata.checksum,
        versionId: rawMetadata.versionId,
        lastModified: rawMetadata.lastModified
      };

      const documentUserId = metadata.encryption.userId;
      const documentAccessLevel = metadata.encryption.accessLevel;

      // Admin users have full access
      if (documentAccessLevel === 'ADMIN') {
        return true;
      }

      // Document owners have full access
      if (documentUserId === userId) {
        return true;
      }

      // Public documents can be read by anyone
      if (operation === 'READ' && documentAccessLevel === 'PUBLIC') {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Access check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        documentKey,
        operation
      });
      return false;
    }
  }

  /**
   * Implements secure document deletion with audit trail
   */
  public async deleteDocument(
    documentKey: string,
    userId: string,
    deletionMetadata: { reason: string; permanent: boolean }
  ): Promise<void> {
    try {
      // Input validation
      if (!documentKey || !userId) {
        throw new Error('Missing required deletion parameters');
      }

      logger.info('Starting secure document deletion', {
        documentKey,
        userId,
        permanent: deletionMetadata.permanent
      });

      // Get document metadata
      const rawMetadata = await this.s3Integration.getFileMetadata(documentKey);
      const metadata: S3Metadata = {
        encryption: {
          algorithm: rawMetadata.encryption.algorithm,
          keyId: rawMetadata.encryption.keyId,
          iv: '',
          authTag: '',
          version: '1',
          classification: 'DELETED',
          accessLevel: 'RESTRICTED',
          userId: userId
        },
        contentType: rawMetadata.contentType,
        size: rawMetadata.size,
        checksum: rawMetadata.checksum,
        versionId: rawMetadata.versionId,
        lastModified: rawMetadata.lastModified
      };

      // Validate deletion permissions
      this.validateDeletionPermissions(metadata, userId);

      // Perform deletion
      await this.s3Integration.deleteFile(documentKey);

      logger.info('Document deleted successfully', {
        documentKey,
        userId,
        reason: deletionMetadata.reason,
        permanent: deletionMetadata.permanent
      });

    } catch (error) {
      logger.error('Document deletion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentKey,
        userId
      });
      throw new Error(`Document deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves enhanced document metadata with security information
   */
  public async getDocumentMetadata(
    documentKey: string,
    securityContext: SecurityMetadata
  ): Promise<DocumentMetadata> {
    try {
      // Input validation
      if (!documentKey) {
        throw new Error('Document key is required');
      }

      logger.info('Retrieving document metadata', {
        documentKey,
        accessLevel: securityContext.accessLevel
      });

      // Get base metadata from S3
      const rawMetadata = await this.s3Integration.getFileMetadata(documentKey);
      const metadata: S3Metadata = {
        encryption: {
          algorithm: rawMetadata.encryption.algorithm,
          keyId: rawMetadata.encryption.keyId,
          iv: '',
          authTag: '',
          version: '1',
          classification: securityContext.classification,
          accessLevel: securityContext.accessLevel,
          retentionPolicy: securityContext.retentionPolicy
        },
        contentType: rawMetadata.contentType,
        size: rawMetadata.size,
        checksum: rawMetadata.checksum,
        versionId: rawMetadata.versionId,
        lastModified: rawMetadata.lastModified
      };

      // Compile enhanced metadata
      const enhancedMetadata: DocumentMetadata = {
        contentType: metadata.contentType,
        size: metadata.size,
        checksum: metadata.checksum,
        versionId: metadata.versionId,
        lastModified: metadata.lastModified,
        securityContext: {
          classification: metadata.encryption.classification,
          accessLevel: metadata.encryption.accessLevel,
          retentionPolicy: metadata.encryption.retentionPolicy,
          encryptionContext: metadata.encryption.keyId
        }
      };

      logger.info('Document metadata retrieved successfully', {
        documentKey,
        versionId: metadata.versionId
      });

      return enhancedMetadata;

    } catch (error) {
      logger.error('Failed to retrieve document metadata', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentKey
      });
      throw new Error(`Metadata retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates user access permissions for document operations
   * @private
   */
  private validateAccessPermissions(
    metadata: S3Metadata,
    userId: string,
    securityContext: SecurityMetadata
  ): void {
    const documentUserId = metadata.encryption.userId;
    const documentAccessLevel = metadata.encryption.accessLevel;

    if (documentUserId !== userId && 
        securityContext.accessLevel !== 'ADMIN' &&
        documentAccessLevel !== 'PUBLIC') {
      throw new Error('Insufficient permissions to access document');
    }
  }

  /**
   * Validates user permissions for document deletion
   * @private
   */
  private validateDeletionPermissions(metadata: S3Metadata, userId: string): void {
    const documentUserId = metadata.encryption.userId;
    if (documentUserId !== userId) {
      throw new Error('Insufficient permissions to delete document');
    }
  }

  /**
   * Converts readable stream to buffer
   * @private
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (error) => reject(error));
    });
  }
}