// @ts-check
import { config } from 'dotenv'; // ^16.0.0 - Environment variable loading and validation

// Load environment variables
config();

// Global AWS configuration settings
const AWS_REGION = process.env.AWS_REGION || 'ca-central-1';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_KMS_KEY_ID = process.env.AWS_KMS_KEY_ID;

// Supported regions for PIPEDA compliance
const SUPPORTED_REGIONS = ['ca-central-1'];

/**
 * Validates AWS configuration settings with detailed error messages
 * @throws {Error} If required configuration is missing or invalid
 */
export const validateAwsConfig = (): void => {
  // Validate AWS Region
  if (!AWS_REGION) {
    throw new Error('AWS_REGION must be configured');
  }
  if (!SUPPORTED_REGIONS.includes(AWS_REGION)) {
    throw new Error(`AWS_REGION must be one of: ${SUPPORTED_REGIONS.join(', ')} for PIPEDA compliance`);
  }

  // Validate S3 Bucket
  if (!AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET must be configured');
  }
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(AWS_S3_BUCKET)) {
    throw new Error('AWS_S3_BUCKET must follow S3 naming conventions');
  }

  // Validate AWS Credentials
  if (!AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_ACCESS_KEY_ID must be configured');
  }
  if (!/^[A-Z0-9]{20}$/.test(AWS_ACCESS_KEY_ID)) {
    throw new Error('AWS_ACCESS_KEY_ID must be a valid 20-character string');
  }

  if (!AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_SECRET_ACCESS_KEY must be configured');
  }
  if (AWS_SECRET_ACCESS_KEY.length < 40) {
    throw new Error('AWS_SECRET_ACCESS_KEY must be at least 40 characters long');
  }

  // Validate KMS Key ID for enhanced encryption
  if (!AWS_KMS_KEY_ID) {
    throw new Error('AWS_KMS_KEY_ID must be configured for enhanced encryption');
  }
};

/**
 * S3 configuration with comprehensive security settings
 */
export const s3Config = {
  region: AWS_REGION,
  bucket: AWS_S3_BUCKET!,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
  encryption: {
    serverSideEncryption: 'AES256',
    bucketKeyEnabled: true,
    kmsKeyId: AWS_KMS_KEY_ID!,
    enforceSSL: true,
  },
  versioning: true,
  lifecycleRules: [
    {
      enabled: true,
      noncurrentVersionExpiration: {
        noncurrentDays: 90,
      },
    },
  ],
  logging: {
    enabled: true,
    prefix: 's3-access-logs/',
  },
  publicAccessBlock: {
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
  replication: {
    role: process.env.AWS_REPLICATION_ROLE!,
    rules: [
      {
        status: 'Enabled',
        destination: {
          bucket: process.env.AWS_REPLICATION_BUCKET!,
          storageClass: 'STANDARD',
        },
      },
    ],
  },
} as const;

/**
 * General AWS configuration with security best practices
 */
export const awsConfig = {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
} as const;

// Export individual config values
export const region = AWS_REGION;
export const keyId = AWS_KMS_KEY_ID;

// Validate configuration on module load
validateAwsConfig();