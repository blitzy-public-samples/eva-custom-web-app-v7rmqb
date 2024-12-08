// aws-sdk v2.1360.0
import AWS from 'aws-sdk';
import { encryptData } from '../utils/encryption.util';
import { logInfo, logError } from '../utils/logger.util';

/**
 * Human Tasks:
 * 1. Set up AWS credentials in environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. Configure AWS regions in environment variables (AWS_REGION, AWS_SES_REGION)
 * 3. Create and configure S3 bucket with appropriate permissions
 * 4. Set up AWS KMS key and add key ID to environment variables
 * 5. Configure SES for email sending (verify domain/email addresses)
 */

// Validate required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_S3_BUCKET',
  'AWS_SES_REGION',
  'AWS_KMS_KEY_ID'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

/**
 * Initializes the AWS S3 client with the necessary configuration.
 * Requirement: Document Storage (Technical Specifications/2.2 Container Architecture/Backend Services)
 * Implements AWS S3 for secure and scalable document storage.
 * 
 * @returns An instance of the AWS S3 client
 */
export const initializeS3 = (): AWS.S3 => {
  try {
    const s3Client = new AWS.S3({
      region: process.env.AWS_REGION,
      apiVersion: '2006-03-01',
      params: {
        Bucket: process.env.AWS_S3_BUCKET
      }
    });

    logInfo('AWS S3 client initialized successfully');
    logInfo(`S3 bucket configured: ${process.env.AWS_S3_BUCKET}`);

    return s3Client;
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize AWS S3 client');
  }
};

/**
 * Initializes the AWS SES client for email notifications.
 * Requirement: Email Notifications (Technical Specifications/1.3 Scope/In-Scope/Integrations)
 * Integrates AWS SES for sending email notifications.
 * 
 * @returns An instance of the AWS SES client
 */
export const initializeSES = (): AWS.SES => {
  try {
    const sesClient = new AWS.SES({
      region: process.env.AWS_SES_REGION,
      apiVersion: '2010-12-01'
    });

    logInfo('AWS SES client initialized successfully');
    logInfo(`SES region configured: ${process.env.AWS_SES_REGION}`);

    return sesClient;
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize AWS SES client');
  }
};

/**
 * Initializes the AWS KMS client for encryption key management.
 * Requirement: Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 * Uses AWS KMS for managing encryption keys securely.
 * 
 * @returns An instance of the AWS KMS client
 */
export const initializeKMS = (): AWS.KMS => {
  try {
    const kmsClient = new AWS.KMS({
      region: process.env.AWS_REGION,
      apiVersion: '2014-11-01'
    });

    // Encrypt the KMS key ID for secure logging
    const encryptedKeyId = encryptData(process.env.AWS_KMS_KEY_ID!, process.env.ENCRYPTION_KEY!);
    logInfo(`AWS KMS client initialized successfully with key ID: ${encryptedKeyId}`);

    return kmsClient;
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize AWS KMS client');
  }
};