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
   * @param fileBuffer - Document content buffer
   * @param fileName - Name of the file
   * @param contentType - MIME type of the file
   * @param userId - ID of the user uploading the document
   * @param securityMetadata - Security classification and access controls
   * @returns Promise resolving to upload result with security context
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
   * @param documentKey - Storage key of the document
   * @param userId - ID of the requesting user
   * @param securityContext - Security validation context
   * @returns Promise resolving to decrypted document content
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
      const metadata = await this.s3Integration.getFileMetadata(documentKey);

      // Validate access permissions
      this.validateAccessPermissions(metadata, userId, securityContext);

      // Download encrypted document
      const encryptedContent = await this.s3Integration.downloadFile(documentKey);

      // Convert readable stream to buffer
      const encryptedBuffer = await this.streamToBuffer(encryptedContent);

      // Get encryption metadata
      const encryptionMetadata = {
        iv: Buffer.from(metadata.encryption?.iv || '', 'base64'),
        authTag: Buffer.from(metadata.encryption?.authTag || '', 'base64'),
        keyVersion: metadata.encryption?.version || '1',
        metadata: {
          algorithm: metadata.encryption?.algorithm || 'aes-256-gcm',
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
   * Implements secure document deletion with audit trail
   * @param documentKey - Storage key of the document
   * @param userId - ID of the requesting user
   * @param deletionMetadata - Metadata for deletion audit
   * @returns Promise resolving to void
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
      const metadata = await this.s3Integration.getFileMetadata(documentKey);

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
   * @param documentKey - Storage key of the document
   * @param securityContext - Security validation context
   * @returns Promise resolving to enhanced metadata
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
      const metadata = await this.s3Integration.getFileMetadata(documentKey);

      // Compile enhanced metadata
      const enhancedMetadata: DocumentMetadata = {
        contentType: metadata.contentType,
        size: metadata.size,
        checksum: metadata.checksum,
        versionId: metadata.versionId,
        lastModified: metadata.lastModified,
        securityContext: {
          classification: metadata.encryption?.classification || 'UNCLASSIFIED',
          accessLevel: metadata.encryption?.accessLevel || 'PRIVATE',
          retentionPolicy: metadata.encryption?.retentionPolicy,
          encryptionContext: metadata.encryption?.keyId
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
    metadata: any,
    userId: string,
    securityContext: SecurityMetadata
  ): void {
    const documentUserId = metadata.encryption?.userId;
    const documentAccessLevel = metadata.encryption?.accessLevel;

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
  private validateDeletionPermissions(metadata: any, userId: string): void {
    const documentUserId = metadata.encryption?.userId;
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