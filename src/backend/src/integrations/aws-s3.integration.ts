/**
 * Estate Kit - AWS S3 Integration
 * Version: 1.0.0
 * 
 * This file implements AWS S3 integration for secure document storage and retrieval.
 * 
 * Requirements Addressed:
 * - Document Storage (Technical Specifications/2.2 Container Architecture/Backend Services)
 *   Implements AWS S3 for secure and scalable document storage.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of documents using encryption and secure AWS configurations.
 * 
 * Human Tasks:
 * 1. Ensure AWS S3 bucket is configured with appropriate CORS settings
 * 2. Verify bucket encryption settings (SSE-KMS)
 * 3. Configure bucket lifecycle policies for document retention
 * 4. Set up appropriate IAM roles and policies for S3 access
 * 5. Configure VPC endpoints for S3 access if running in VPC
 */

// aws-sdk v2.1360.0
import { S3 } from 'aws-sdk';
import { encryptData, decryptData } from '../utils/encryption.util';
import { initializeS3 } from '../config/aws';
import { logInfo, logError } from '../utils/logger.util';

// Constants for S3 configuration
const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// S3 upload configuration
const UPLOAD_OPTIONS = {
  ServerSideEncryption: 'aws:kms',
  KMSKeyId: process.env.AWS_KMS_KEY_ID,
  ContentType: 'application/octet-stream'
};

/**
 * Uploads a document to AWS S3 with encryption.
 * Implements requirement: Document Storage - Secure document upload to S3
 * 
 * @param documentBuffer - The document buffer to upload
 * @param documentKey - The unique key for the document in S3
 * @returns Promise<string> - The URL of the uploaded document
 * @throws Error if upload fails
 */
export const uploadDocument = async (
  documentBuffer: Buffer,
  documentKey: string
): Promise<string> => {
  try {
    // Initialize S3 client
    const s3Client: S3 = initializeS3();

    // Encrypt the document buffer before upload
    const encryptedBuffer = Buffer.from(
      encryptData(documentBuffer.toString('base64'), ENCRYPTION_KEY!)
    );

    // Prepare upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME!,
      Key: documentKey,
      Body: encryptedBuffer,
      ...UPLOAD_OPTIONS
    };

    // Upload to S3
    const uploadResult = await s3Client.upload(uploadParams).promise();

    logInfo(`Document uploaded successfully: ${documentKey}`);
    return uploadResult.Location;

  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to upload document to S3');
  }
};

/**
 * Downloads a document from AWS S3 and decrypts it.
 * Implements requirement: Document Storage - Secure document retrieval from S3
 * 
 * @param documentKey - The unique key of the document in S3
 * @returns Promise<Buffer> - The decrypted document buffer
 * @throws Error if download fails
 */
export const downloadDocument = async (
  documentKey: string
): Promise<Buffer> => {
  try {
    // Initialize S3 client
    const s3Client: S3 = initializeS3();

    // Prepare download parameters
    const downloadParams = {
      Bucket: BUCKET_NAME!,
      Key: documentKey
    };

    // Download from S3
    const downloadResult = await s3Client.getObject(downloadParams).promise();
    
    if (!downloadResult.Body) {
      throw new Error('Downloaded document is empty');
    }

    // Decrypt the document buffer
    const decryptedBuffer = Buffer.from(
      decryptData(downloadResult.Body.toString('base64'), ENCRYPTION_KEY!)
    );

    logInfo(`Document downloaded successfully: ${documentKey}`);
    return decryptedBuffer;

  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to download document from S3');
  }
};

/**
 * Deletes a document from AWS S3.
 * Implements requirement: Document Storage - Secure document deletion from S3
 * 
 * @param documentKey - The unique key of the document in S3
 * @returns Promise<boolean> - True if deletion was successful
 * @throws Error if deletion fails
 */
export const deleteDocument = async (
  documentKey: string
): Promise<boolean> => {
  try {
    // Initialize S3 client
    const s3Client: S3 = initializeS3();

    // Prepare delete parameters
    const deleteParams = {
      Bucket: BUCKET_NAME!,
      Key: documentKey
    };

    // Delete from S3
    await s3Client.deleteObject(deleteParams).promise();

    logInfo(`Document deleted successfully: ${documentKey}`);
    return true;

  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to delete document from S3');
  }
};