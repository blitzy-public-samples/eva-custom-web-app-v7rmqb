// @ts-check
import crypto from 'crypto'; // native - Node.js crypto module
import AWS from 'aws-sdk'; // ^2.1.0 - AWS SDK for KMS integration
import { keyId, region } from '../config/aws';

// Constants for encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const MIN_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha512';

// Initialize AWS KMS client
const kms = new AWS.KMS({ region });

/**
 * Interface for encrypted data structure
 */
interface EncryptedData {
  content: Buffer;
  iv: Buffer;
  authTag: Buffer;
  metadata: {
    algorithm: string;
    timestamp: number;
    context?: string;
  };
}

/**
 * Interface for key derivation options
 */
interface KeyDerivationOptions {
  iterations?: number;
  keyLength?: number;
  digest?: string;
}

/**
 * Interface for key rotation configuration
 */
interface RotationConfig {
  useKms?: boolean;
  reEncryptData?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Encrypts data using AES-256-GCM with comprehensive security measures
 * @param data - Data to encrypt
 * @param key - Encryption key
 * @param context - Optional encryption context
 * @returns Encrypted data object
 * @throws Error if encryption fails
 */
export async function encrypt(data: Buffer, key: Buffer, context?: string): Promise<EncryptedData> {
  try {
    // Input validation
    if (!Buffer.isBuffer(data) || !Buffer.isBuffer(key)) {
      throw new Error('Invalid input: data and key must be Buffers');
    }
    if (key.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length: expected ${KEY_LENGTH} bytes`);
    }

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Create encrypted data object
    const encryptedData: EncryptedData = {
      content: encrypted,
      iv,
      authTag,
      metadata: {
        algorithm: ENCRYPTION_ALGORITHM,
        timestamp: Date.now(),
        context
      }
    };

    return encryptedData;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Encryption failed: ${errorMessage}`);
  }
}

/**
 * Decrypts data using AES-256-GCM with comprehensive error handling
 * @param encryptedData - Encrypted data object
 * @param key - Decryption key
 * @returns Decrypted data
 * @throws Error if decryption fails
 */
export async function decrypt(encryptedData: EncryptedData, key: Buffer): Promise<Buffer> {
  try {
    // Validate input
    if (!encryptedData?.content || !encryptedData.iv || !encryptedData.authTag) {
      throw new Error('Invalid encrypted data structure');
    }
    if (!Buffer.isBuffer(key) || key.length !== KEY_LENGTH) {
      throw new Error(`Invalid key: expected ${KEY_LENGTH} bytes Buffer`);
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, encryptedData.iv);
    decipher.setAuthTag(encryptedData.authTag);

    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(encryptedData.content),
      decipher.final()
    ]);

    return decrypted;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Decryption failed: ${errorMessage}`);
  }
}

/**
 * Generates a cryptographically secure random encryption key
 * @param keyType - Type of key to generate
 * @param options - Generation options
 * @returns Promise resolving to generated key
 */
export async function generateEncryptionKey(
  keyType: 'local' | 'kms' = 'local',
  options: { keySpec?: string } = {}
): Promise<Buffer> {
  try {
    if (keyType === 'kms' && keyId) {
      // Generate key using KMS
      const params = {
        KeyId: keyId,
        NumberOfBytes: KEY_LENGTH,
        KeySpec: options.keySpec || 'AES_256'
      };
      
      const { Plaintext } = await kms.generateDataKey(params).promise();
      return Buffer.from(Plaintext as Buffer);
    } else {
      // Generate key locally
      return crypto.randomBytes(KEY_LENGTH);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Key generation failed: ${errorMessage}`);
  }
}

/**
 * Generates a cryptographically secure random salt
 * @param length - Length of salt in bytes
 * @returns Generated salt
 * @throws Error if generation fails
 */
export function generateSalt(length: number = SALT_LENGTH): Buffer {
  if (length < 16) {
    throw new Error('Salt length must be at least 16 bytes');
  }
  return crypto.randomBytes(length);
}

/**
 * Derives an encryption key from a password using PBKDF2
 * @param password - Password to derive key from
 * @param salt - Salt for key derivation
 * @param options - Derivation options
 * @returns Promise resolving to derived key
 */
export async function deriveKey(
  password: string,
  salt: Buffer,
  options: KeyDerivationOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const iterations = Math.max(options.iterations || MIN_ITERATIONS, MIN_ITERATIONS);
    const keyLength = options.keyLength || KEY_LENGTH;
    const digest = options.digest || PBKDF2_DIGEST;

    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keyLength,
      digest,
      (err, derivedKey) => {
        if (err) reject(new Error(`Key derivation failed: ${err.message}`));
        else resolve(derivedKey);
      }
    );
  });
}

/**
 * Implements secure key rotation with KMS integration
 * @param currentKey - Current encryption key
 * @param rotationConfig - Rotation configuration
 * @returns Promise resolving to new key and rotation metadata
 */
export async function rotateKey(
  currentKey: Buffer,
  rotationConfig: RotationConfig = {}
): Promise<{ newKey: Buffer; metadata: Record<string, unknown> }> {
  try {
    // Generate new key
    const newKey = await generateEncryptionKey(
      rotationConfig.useKms ? 'kms' : 'local'
    );

    // Create rotation metadata
    const metadata = {
      rotationTimestamp: Date.now(),
      keyGeneration: rotationConfig.useKms ? 'kms' : 'local',
      ...rotationConfig.metadata
    };

    return { newKey, metadata };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Key rotation failed: ${errorMessage}`);
  }
}