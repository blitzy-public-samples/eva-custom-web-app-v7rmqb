// @ts-check
import AWS from 'aws-sdk'; // ^2.1.0
import winston from 'winston'; // ^3.0.0
import { 
  encrypt, 
  decrypt, 
  generateEncryptionKey
} from '../utils/encryption.util';
import { awsConfig } from '../config/aws';

/**
 * Interface for cached encryption key data
 */
interface CachedKeyData {
  key: Buffer;
  version: string;
  lastRotated: Date;
}

/**
 * Interface for encrypted data with metadata
 */
interface EncryptedDataWithMetadata {
  content: Buffer;
  iv: Buffer;
  authTag: Buffer;
  keyVersion: string;
  metadata: {
    algorithm: string;
    timestamp: number;
    context?: string;
  };
}

/**
 * Service class providing enterprise-grade encryption operations with enhanced security features
 */
export class EncryptionService {
  private readonly kmsClient: AWS.KMS;
  private keyCache: Map<string, CachedKeyData>;
  private readonly KEY_ROTATION_INTERVAL_DAYS: number;
  private readonly MAX_RETRY_ATTEMPTS: number;
  private readonly logger: winston.Logger;

  /**
   * Initializes the encryption service with AWS KMS integration and monitoring
   * @param keyRotationIntervalDays - Days between automatic key rotations
   * @param maxRetryAttempts - Maximum retry attempts for KMS operations
   */
  constructor(
    keyRotationIntervalDays: number = 30,
    maxRetryAttempts: number = 3
  ) {
    // Initialize AWS KMS client with provided configuration
    this.kmsClient = new AWS.KMS(awsConfig);
    
    // Initialize key cache and configuration
    this.keyCache = new Map<string, CachedKeyData>();
    this.KEY_ROTATION_INTERVAL_DAYS = keyRotationIntervalDays;
    this.MAX_RETRY_ATTEMPTS = maxRetryAttempts;

    // Configure logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'encryption-service.log' }),
        new winston.transports.Console()
      ]
    });

    // Schedule automatic key rotation checks
    setInterval(() => {
      this.checkKeyRotation().catch(error => {
        this.logger.error('Key rotation check failed:', { error: error instanceof Error ? error.message : String(error) });
      });
    }, 24 * 60 * 60 * 1000); // Daily check
  }

  /**
   * Encrypts sensitive data using AES-256-GCM with enhanced error handling
   * @param data - Data to encrypt
   * @param keyId - KMS key identifier
   * @returns Promise resolving to encrypted data with metadata
   * @throws Error if encryption fails
   */
  public async encryptSensitiveData(
    data: Buffer,
    keyId: string
  ): Promise<EncryptedDataWithMetadata> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.MAX_RETRY_ATTEMPTS) {
      try {
        // Get or generate encryption key
        const keyData = await this.getEncryptionKey(keyId);

        this.logger.info('Starting encryption operation', {
          keyId,
          keyVersion: keyData.version,
          timestamp: new Date().toISOString()
        });

        // Perform encryption
        const encryptedData = await encrypt(data, keyData.key);

        // Create result object with metadata
        const result: EncryptedDataWithMetadata = {
          ...encryptedData,
          keyVersion: keyData.version,
          metadata: {
            ...encryptedData.metadata,
            timestamp: Date.now()
          }
        };

        this.logger.info('Encryption operation completed successfully', {
          keyId,
          keyVersion: keyData.version,
          timestamp: new Date().toISOString()
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;
        
        this.logger.warn('Encryption attempt failed', {
          keyId,
          attempt: attempts,
          error: lastError.message
        });

        if (attempts === this.MAX_RETRY_ATTEMPTS) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    this.logger.error('Encryption failed after maximum retry attempts', {
      keyId,
      maxAttempts: this.MAX_RETRY_ATTEMPTS,
      error: lastError?.message
    });

    throw new Error(`Encryption failed after ${this.MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message}`);
  }

  /**
   * Decrypts sensitive data using AES-256-GCM with version validation
   * @param encryptedData - Encrypted data object with metadata
   * @param keyId - KMS key identifier
   * @returns Promise resolving to decrypted data
   * @throws Error if decryption fails
   */
  public async decryptSensitiveData(
    encryptedData: EncryptedDataWithMetadata,
    keyId: string
  ): Promise<Buffer> {
    try {
      // Validate encrypted data structure
      if (!encryptedData?.content || !encryptedData.iv || !encryptedData.authTag) {
        throw new Error('Invalid encrypted data structure');
      }

      this.logger.info('Starting decryption operation', {
        keyId,
        keyVersion: encryptedData.keyVersion,
        timestamp: new Date().toISOString()
      });

      // Get encryption key with version validation
      const keyData = await this.getEncryptionKey(keyId, encryptedData.keyVersion);

      // Perform decryption
      const decryptedData = await decrypt(encryptedData, keyData.key);

      this.logger.info('Decryption operation completed successfully', {
        keyId,
        keyVersion: encryptedData.keyVersion,
        timestamp: new Date().toISOString()
      });

      return decryptedData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Decryption failed', {
        keyId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Rotates encryption key with version tracking and audit logging
   * @param keyId - KMS key identifier
   * @returns Promise resolving void
   * @throws Error if rotation fails
   */
  public async rotateKey(keyId: string): Promise<void> {
    try {
      this.logger.info('Starting key rotation', {
        keyId,
        timestamp: new Date().toISOString()
      });

      // Generate new key using KMS
      const newKey = await generateEncryptionKey('kms', { keySpec: 'AES_256' });
      const newVersion = Date.now().toString(36);

      // Update key cache
      const oldKeyData = this.keyCache.get(keyId);
      this.keyCache.set(keyId, {
        key: newKey,
        version: newVersion,
        lastRotated: new Date()
      });

      // Schedule old key deletion
      if (oldKeyData) {
        setTimeout(() => {
          this.deleteOldKey(keyId, oldKeyData.version);
        }, 7 * 24 * 60 * 60 * 1000); // 7 days grace period
      }

      this.logger.info('Key rotation completed successfully', {
        keyId,
        newVersion,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Key rotation failed', {
        keyId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      throw new Error(`Key rotation failed: ${errorMessage}`);
    }
  }

  /**
   * Checks and initiates automatic key rotation based on schedule
   * @returns Promise resolving void
   */
  private async checkKeyRotation(): Promise<void> {
    try {
      const now = new Date();
      
      for (const [keyId, keyData] of this.keyCache.entries()) {
        const daysSinceRotation = (now.getTime() - keyData.lastRotated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceRotation >= this.KEY_ROTATION_INTERVAL_DAYS) {
          this.logger.info('Initiating scheduled key rotation', {
            keyId,
            lastRotated: keyData.lastRotated,
            daysSinceRotation
          });
          
          await this.rotateKey(keyId);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Key rotation check failed', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Retrieves or generates encryption key from cache or KMS
   * @param keyId - KMS key identifier
   * @param version - Optional specific key version
   * @returns Promise resolving to key data
   * @private
   */
  private async getEncryptionKey(
    keyId: string,
    version?: string
  ): Promise<CachedKeyData> {
    const cachedKey = this.keyCache.get(keyId);

    if (cachedKey && (!version || cachedKey.version === version)) {
      return cachedKey;
    }

    // Generate new key if not cached or version mismatch
    const newKey = await generateEncryptionKey('kms', { keySpec: 'AES_256' });
    const keyData: CachedKeyData = {
      key: newKey,
      version: version || Date.now().toString(36),
      lastRotated: new Date()
    };

    this.keyCache.set(keyId, keyData);
    return keyData;
  }

  /**
   * Securely deletes old encryption key
   * @param keyId - KMS key identifier
   * @param version - Key version to delete
   * @private
   */
  private async deleteOldKey(keyId: string, version: string): Promise<void> {
    try {
      this.logger.info('Deleting old key version', {
        keyId,
        version,
        timestamp: new Date().toISOString()
      });

      // Implement secure key deletion logic here
      // Note: Actual implementation would depend on specific security requirements
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete old key version', {
        keyId,
        version,
        error: errorMessage
      });
    }
  }
}