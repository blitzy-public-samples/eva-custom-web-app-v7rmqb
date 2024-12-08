/**
 * Estate Kit - Storage Service
 * Version: 1.0.0
 * 
 * This service handles document storage operations using AWS S3.
 * 
 * Human Tasks:
 * 1. Ensure AWS S3 bucket is properly configured with appropriate CORS and security settings
 * 2. Verify that the encryption key is securely stored in environment variables
 * 3. Configure S3 bucket lifecycle policies for document retention
 * 4. Set up S3 bucket monitoring and alerts for storage capacity
 */

// aws-sdk v2.1360.0
import { S3 } from 'aws-sdk';
import { encryptData } from '../utils/encryption.util';
import { initializeS3 } from '../config/aws';
import { logInfo, logError } from '../utils/logger.util';

// Constants for S3 configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const DOCUMENT_EXPIRY_DAYS = 7; // Default expiry for pre-signed URLs

/**
 * Uploads a document to AWS S3 with encryption.
 * Requirement: Document Storage (Technical Specifications/2.2 Container Architecture/Backend Services)
 * Implements AWS S3 for secure and scalable document storage.
 * 
 * @param documentBuffer - The document buffer to upload
 * @param fileName - The name of the file to be stored
 * @param encryptionKey - The key to use for encrypting the document
 * @returns Promise<string> - The URL of the uploaded document
 */
export const uploadDocument = async (
  documentBuffer: Buffer,
  fileName: string,
  encryptionKey: string
): Promise<string> => {
  try {
    // Initialize S3 client
    const s3Client: S3 = initializeS3();

    // Encrypt the document buffer
    const encryptedBuffer = Buffer.from(
      encryptData(documentBuffer.toString('base64'), encryptionKey),
      'base64'
    );

    // Generate a unique key for the document
    const documentKey = `documents/${Date.now()}-${fileName}`;

    // Set up upload parameters with server-side encryption
    const uploadParams = {
      Bucket: S3_BUCKET!,
      Key: documentKey,
      Body: encryptedBuffer,
      ContentType: 'application/octet-stream',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'x-amz-meta-encrypted': 'true',
        'x-amz-meta-original-name': fileName
      }
    };

    // Upload the encrypted document to S3
    await s3Client.upload(uploadParams).promise();

    // Log successful upload
    logInfo(`Document uploaded successfully: ${documentKey}`);

    // Generate a pre-signed URL for the uploaded document
    const signedUrl = s3Client.getSignedUrl('getObject', {
      Bucket: S3_BUCKET,
      Key: documentKey,
      Expires: DOCUMENT_EXPIRY_DAYS * 24 * 60 * 60 // Convert days to seconds
    });

    return signedUrl;
  } catch (error) {
    // Log error and rethrow
    logError(error as Error);
    throw new Error('Failed to upload document to S3');
  }
};

/**
 * Deletes a document from AWS S3.
 * Requirement: Document Storage (Technical Specifications/2.2 Container Architecture/Backend Services)
 * Implements secure document deletion from AWS S3.
 * 
 * @param fileName - The name of the file to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export const deleteDocument = async (fileName: string): Promise<boolean> => {
  try {
    // Initialize S3 client
    const s3Client: S3 = initializeS3();

    // Set up delete parameters
    const deleteParams = {
      Bucket: S3_BUCKET!,
      Key: `documents/${fileName}`
    };

    // Delete the document from S3
    await s3Client.deleteObject(deleteParams).promise();

    // Log successful deletion
    logInfo(`Document deleted successfully: ${fileName}`);

    return true;
  } catch (error) {
    // Log error but don't rethrow to maintain function contract
    logError(error as Error);
    return false;
  }
};

/**
 * Validates that required environment variables are set
 * Throws an error if any required variables are missing
 */
const validateEnvironment = (): void => {
  const requiredVars = ['AWS_S3_BUCKET', 'AWS_REGION', 'ENCRYPTION_KEY'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
};

// Validate environment on module load
validateEnvironment();