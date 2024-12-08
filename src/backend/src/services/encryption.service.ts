/**
 * Estate Kit - Encryption Service
 * Version: 1.0.0
 * 
 * This service provides encryption and decryption capabilities using AWS KMS and AES-256.
 * 
 * Requirements Addressed:
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Implements encryption and decryption services to ensure secure handling of sensitive data.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Supports secure encryption of role-based access control data.
 * 
 * Human Tasks:
 * 1. Ensure AWS KMS key is properly configured and accessible
 * 2. Verify that encryption keys are securely stored in environment variables
 * 3. Review key rotation policies and procedures
 * 4. Configure AWS KMS permissions for the service role
 */

// aws-sdk v2.1360.0
import { KMS } from 'aws-sdk';
import { encryptData, decryptData } from '../utils/encryption.util';
import { initializeKMS } from '../config/aws';
import { DocumentTypes } from '../types/document.types';
import { UserTypes } from '../types/user.types';

/**
 * Encrypts data using AWS KMS.
 * Implements requirement: Data Security - Secure encryption of sensitive data
 * 
 * @param data - The string data to be encrypted
 * @param keyId - The AWS KMS key ID to use for encryption
 * @returns The encrypted data in base64 format
 * @throws Error if encryption fails
 */
export const encryptWithKMS = async (data: string, keyId: string): Promise<string> => {
  try {
    const kms: KMS = initializeKMS();
    
    const params = {
      KeyId: keyId,
      Plaintext: Buffer.from(data)
    };

    const result = await kms.encrypt(params).promise();
    
    if (!result.CiphertextBlob) {
      throw new Error('Encryption failed: No ciphertext blob returned');
    }

    return result.CiphertextBlob.toString('base64');
  } catch (error) {
    console.error('KMS encryption error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to encrypt data using KMS');
  }
};

/**
 * Decrypts data using AWS KMS.
 * Implements requirement: Data Security - Secure decryption of sensitive data
 * 
 * @param encryptedData - The encrypted data in base64 format
 * @param keyId - The AWS KMS key ID used for encryption
 * @returns The decrypted original data
 * @throws Error if decryption fails
 */
export const decryptWithKMS = async (encryptedData: string, keyId: string): Promise<string> => {
  try {
    const kms: KMS = initializeKMS();
    
    const params = {
      KeyId: keyId,
      CiphertextBlob: Buffer.from(encryptedData, 'base64')
    };

    const result = await kms.decrypt(params).promise();
    
    if (!result.Plaintext) {
      throw new Error('Decryption failed: No plaintext returned');
    }

    return result.Plaintext.toString('utf-8');
  } catch (error) {
    console.error('KMS decryption error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to decrypt data using KMS');
  }
};

/**
 * Encrypts document metadata using AES-256 encryption.
 * Implements requirement: Data Security - Protection of document metadata
 * 
 * @param document - The document object containing metadata to encrypt
 * @param encryptionKey - The encryption key to use
 * @returns The document with encrypted metadata
 * @throws Error if encryption fails
 */
export const encryptDocumentMetadata = (
  document: DocumentTypes,
  encryptionKey: string
): DocumentTypes => {
  try {
    const encryptedMetadata = Object.entries(document.metadata).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === 'string' ? encryptData(value, encryptionKey) : value
      }),
      {}
    );

    return {
      ...document,
      metadata: encryptedMetadata
    };
  } catch (error) {
    console.error('Document metadata encryption error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to encrypt document metadata');
  }
};

/**
 * Decrypts document metadata using AES-256 decryption.
 * Implements requirement: Data Security - Access to protected document metadata
 * 
 * @param document - The document object containing encrypted metadata
 * @param encryptionKey - The encryption key to use
 * @returns The document with decrypted metadata
 * @throws Error if decryption fails
 */
export const decryptDocumentMetadata = (
  document: DocumentTypes,
  encryptionKey: string
): DocumentTypes => {
  try {
    const decryptedMetadata = Object.entries(document.metadata).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === 'string' ? decryptData(value, encryptionKey) : value
      }),
      {}
    );

    return {
      ...document,
      metadata: decryptedMetadata
    };
  } catch (error) {
    console.error('Document metadata decryption error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to decrypt document metadata');
  }
};