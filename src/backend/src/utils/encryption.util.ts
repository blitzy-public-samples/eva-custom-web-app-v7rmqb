/**
 * Estate Kit - Encryption Utilities
 * Version: 1.0.0
 * 
 * This file provides utility functions for encryption and decryption of sensitive data
 * in the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Implements encryption and decryption utilities to ensure secure handling of sensitive data.
 * 
 * Human Tasks:
 * 1. Ensure encryption key is securely stored in environment variables
 * 2. Verify that the encryption algorithm (AES-256-CBC) meets security requirements
 * 3. Review key rotation policies and procedures
 */

// @package crypto (Node.js built-in)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { UserTypes } from '../types/user.types';

// Constants for encryption
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES-256-CBC
const KEY_LENGTH = 32; // 256 bits

/**
 * Encrypts a given string using AES-256-CBC encryption.
 * Implements requirement: Data Security - Encryption of sensitive data
 * 
 * @param data - The string to be encrypted
 * @param encryptionKey - The key to use for encryption (must be 32 bytes for AES-256)
 * @returns The encrypted data in base64 format with IV prepended
 * @throws Error if encryption fails or if key length is invalid
 */
export const encryptData = (data: string, encryptionKey: string): string => {
  try {
    // Validate encryption key length
    if (Buffer.from(encryptionKey).length !== KEY_LENGTH) {
      throw new Error('Invalid encryption key length. Key must be 32 bytes for AES-256.');
    }

    // Generate a random initialization vector
    const iv = randomBytes(IV_LENGTH);

    // Create cipher with key and IV
    const cipher = createCipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey),
      iv
    );

    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Combine IV and encrypted data
    // IV needs to be stored with the encrypted data for decryption
    const combinedData = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'base64')
    ]);

    // Return the combined data in base64 format
    return combinedData.toString('base64');
  } catch (error) {
    // Log error for monitoring but don't expose internal details
    console.error('Encryption error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts a given string that was encrypted using AES-256-CBC encryption.
 * Implements requirement: Data Security - Decryption of sensitive data
 * 
 * @param encryptedData - The encrypted string in base64 format (including IV)
 * @param encryptionKey - The key to use for decryption (must be 32 bytes for AES-256)
 * @returns The decrypted original string
 * @throws Error if decryption fails or if key length is invalid
 */
export const decryptData = (encryptedData: string, encryptionKey: string): string => {
  try {
    // Validate encryption key length
    if (Buffer.from(encryptionKey).length !== KEY_LENGTH) {
      throw new Error('Invalid encryption key length. Key must be 32 bytes for AES-256.');
    }

    // Convert the combined data from base64 to buffer
    const combinedBuffer = Buffer.from(encryptedData, 'base64');

    // Extract the IV and encrypted data
    const iv = combinedBuffer.slice(0, IV_LENGTH);
    const encryptedContent = combinedBuffer.slice(IV_LENGTH);

    // Create decipher with key and IV
    const decipher = createDecipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey),
      iv
    );

    // Decrypt the data
    let decrypted = decipher.update(encryptedContent);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Return the decrypted string
    return decrypted.toString('utf8');
  } catch (error) {
    // Log error for monitoring but don't expose internal details
    console.error('Decryption error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to decrypt data');
  }
};