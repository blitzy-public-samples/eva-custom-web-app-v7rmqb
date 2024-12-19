/**
 * AWS S3 Integration Module
 * Provides secure document storage operations with enhanced security features
 * @module S3Integration
 * @version 1.0.0
 */

import { 
  S3Client,
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand,
  GetObjectCommandOutput } from '@aws-sdk/client-s3'; // ^3.0.0
import { injectable } from 'tsyringe'; // ^4.7.0
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { s3Config } from '../config/aws';
import { logger } from '../utils/logger.util';

interface UploadResult {
  url: string;
  versionId: string;
  etag: string;
  metadata: Record<string, string>;
}

interface EnhancedMetadata {
  contentType: string;
  lastModified: Date;
  versionId: string;
  size: number;
  checksum: string;
  encryption: {
    algorithm: string;
    keyId?: string;
  };
  replicationStatus: string;
}

@injectable()
export class S3Integration {
  private s3Client: S3Client;
  private readonly bucket: string;
  private readonly encryptionConfig: typeof s3Config.encryption;

  constructor() {
    if (!s3Config.bucket) {
      throw new Error('S3 bucket name is required');
    }

    // Initialize S3 client with enhanced configuration
    this.s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.credentials.accessKeyId || '',
        secretAccessKey: s3Config.credentials.secretAccessKey || ''
      },
      maxAttempts: 3
    });

    this.bucket = s3Config.bucket;
    this.encryptionConfig = s3Config.encryption;

    // Validate S3 configuration
    this.validateConfiguration();
  }

  /**
   * Uploads file to S3 with enhanced security features
   * @param fileBuffer - File content buffer
   * @param key - Unique file identifier
   * @param contentType - MIME type of the file
   * @param metadata - Additional file metadata
   * @returns Promise<UploadResult>
   */
  async uploadFile(
    fileBuffer: Buffer,
    key: string,
    contentType: string,
    metadata: Record<string, string> = {}
  ): Promise<UploadResult> {
    try {
      // Validate input parameters
      if (!fileBuffer || !key || !contentType) {
        throw new Error('Missing required upload parameters');
      }

      // Calculate file checksum
      const checksum = createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      // Configure upload command with enhanced security
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ServerSideEncryption: this.encryptionConfig.serverSideEncryption,
        BucketKeyEnabled: this.encryptionConfig.bucketKeyEnabled,
        SSEKMSKeyId: this.encryptionConfig.kmsKeyId,
        Metadata: {
          ...metadata,
          checksum,
          uploadTimestamp: new Date().toISOString()
        }
      });

      // Execute upload with enhanced error handling
      const result = await this.s3Client.send(uploadCommand);

      // Log successful upload with audit trail
      logger.info('File uploaded successfully', {
        key,
        size: fileBuffer.length,
        checksum,
        versionId: result.VersionId
      });

      return {
        url: `https://${this.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`,
        versionId: result.VersionId || '',
        etag: result.ETag || '',
        metadata: {
          ...metadata,
          checksum
        }
      };

    } catch (error) {
      logger.error('Failed to upload file to S3', {
        error,
        key,
        size: fileBuffer.length
      });
      throw error;
    }
  }

  /**
   * Downloads file from S3 with streaming support
   * @param key - File identifier
   * @param versionId - Optional specific version ID
   * @returns Promise<ReadableStream>
   */
  async downloadFile(key: string, versionId?: string): Promise<Readable> {
    try {
      // Validate parameters
      if (!key) {
        throw new Error('File key is required');
      }

      // Configure download command
      const downloadCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId
      });

      // Execute download with streaming
      const response: GetObjectCommandOutput = await this.s3Client.send(downloadCommand);

      // Verify file integrity
      if (!response.Body) {
        throw new Error('Empty file content received');
      }

      // Log successful download
      logger.info('File download initiated', {
        key,
        versionId,
        contentLength: response.ContentLength
      });

      return response.Body as Readable;

    } catch (error) {
      logger.error('Failed to download file from S3', {
        error,
        key,
        versionId
      });
      throw error;
    }
  }

  /**
   * Deletes file from S3 with versioning support
   * @param key - File identifier
   * @param versionId - Optional specific version ID
   * @returns Promise<void>
   */
  async deleteFile(key: string, versionId?: string): Promise<void> {
    try {
      // Validate parameters
      if (!key) {
        throw new Error('File key is required');
      }

      // Configure delete command
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId
      });

      // Execute deletion
      await this.s3Client.send(deleteCommand);

      // Log successful deletion
      logger.info('File deleted successfully', {
        key,
        versionId
      });

    } catch (error) {
      logger.error('Failed to delete file from S3', {
        error,
        key,
        versionId
      });
      throw error;
    }
  }

  /**
   * Retrieves enhanced file metadata from S3
   * @param key - File identifier
   * @param versionId - Optional specific version ID
   * @returns Promise<EnhancedMetadata>
   */
  async getFileMetadata(key: string, versionId?: string): Promise<EnhancedMetadata> {
    try {
      // Validate parameters
      if (!key) {
        throw new Error('File key is required');
      }

      // Configure metadata command
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId
      });

      // Execute metadata retrieval
      const response = await this.s3Client.send(headCommand);

      // Format enhanced metadata
      const metadata: EnhancedMetadata = {
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        versionId: response.VersionId || '',
        size: response.ContentLength || 0,
        checksum: response.Metadata?.checksum || '',
        encryption: {
          algorithm: response.ServerSideEncryption || 'AES256',
          keyId: response.SSEKMSKeyId
        },
        replicationStatus: response.ReplicationStatus || 'NONE'
      };

      // Log metadata access
      logger.info('File metadata retrieved', {
        key,
        versionId,
        size: metadata.size
      });

      return metadata;

    } catch (error) {
      logger.error('Failed to retrieve file metadata from S3', {
        error,
        key,
        versionId
      });
      throw error;
    }
  }

  /**
   * Validates S3 configuration
   * @private
   */
  private validateConfiguration(): void {
    if (!this.bucket) {
      throw new Error('S3 bucket name is required');
    }

    if (!this.encryptionConfig.serverSideEncryption) {
      throw new Error('Server-side encryption configuration is required');
    }

    if (!this.encryptionConfig.kmsKeyId) {
      throw new Error('KMS key ID is required for enhanced encryption');
    }

    logger.info('S3 integration initialized successfully', {
      bucket: this.bucket,
      region: s3Config.region
    });
  }
}