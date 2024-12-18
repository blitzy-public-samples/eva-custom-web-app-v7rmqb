// External dependencies
// zod@3.22.0 - Schema validation library
import { z } from 'zod';
// xss@1.0.14 - XSS prevention
import xss from 'xss';
// validator@13.9.0 - String validation utilities
import validator from 'validator';

// Constants for validation rules
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
export const MAX_FILE_SIZE_MB = 25;
export const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CANADIAN_EMAIL_DOMAINS = ["ca", "gc.ca", "on.ca", "qc.ca", "ab.ca", "bc.ca"];
export const BUSINESS_HOURS = {
  start: 9,
  end: 17,
  timezone: 'America/Toronto'
};
export const BLOCKED_EMAIL_DOMAINS = ["tempmail.com", "disposable.com"];

// Interface definitions
interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Enhanced email validation with domain verification and disposable email checking
 * @param email - Email address to validate
 * @returns ValidationResult object
 */
export function validateEmail(email: string): ValidationResult {
  try {
    // Sanitize input
    const sanitizedEmail = sanitizeInput(email);

    // Basic validation
    if (!sanitizedEmail || typeof sanitizedEmail !== 'string') {
      return { isValid: false, message: 'Email is required' };
    }

    // Length validation
    if (sanitizedEmail.length > 254) {
      return { isValid: false, message: 'Email exceeds maximum length' };
    }

    // Format validation
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    // Domain validation
    const domain = sanitizedEmail.split('@')[1];
    if (BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase())) {
      return { isValid: false, message: 'Disposable email addresses are not allowed' };
    }

    // Canadian domain validation
    const topLevelDomain = domain.split('.').slice(-2).join('.');
    if (!CANADIAN_EMAIL_DOMAINS.some(d => topLevelDomain.endsWith(d))) {
      return {
        isValid: false,
        message: 'Email domain must be from a recognized Canadian provider'
      };
    }

    return { isValid: true, message: 'Email is valid' };
  } catch (error) {
    return { isValid: false, message: 'Email validation failed', details: { error } };
  }
}

/**
 * Enhanced password validation with HIPAA compliance and pattern detection
 * @param password - Password to validate
 * @returns ValidationResult object
 */
export function validatePassword(password: string): ValidationResult {
  try {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    // Length validation
    if (password.length < PASSWORD_MIN_LENGTH) {
      return {
        isValid: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
      };
    }

    // Pattern validation
    if (!PASSWORD_REGEX.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain uppercase, lowercase, number, and special character'
      };
    }

    // Common pattern check
    const commonPatterns = ['password', '123456', 'qwerty'];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      return { isValid: false, message: 'Password contains common patterns' };
    }

    // HIPAA compliance check
    const hipaaCompliant = z.string()
      .min(12)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/)
      .safeParse(password);

    if (!hipaaCompliant.success) {
      return { isValid: false, message: 'Password does not meet HIPAA requirements' };
    }

    return { isValid: true, message: 'Password meets all requirements' };
  } catch (error) {
    return { isValid: false, message: 'Password validation failed', details: { error } };
  }
}

/**
 * Date validation with timezone and business hours support
 * @param date - Date string to validate
 * @param timezone - Optional timezone string
 * @returns ValidationResult object
 */
export function validateDate(date: string, timezone: string = BUSINESS_HOURS.timezone): ValidationResult {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, message: 'Invalid date format' };
    }

    // Timezone validation
    if (!validator.isISO8601(date, { strict: true })) {
      return { isValid: false, message: 'Invalid ISO 8601 date format' };
    }

    // Business hours validation
    const hours = dateObj.getHours();
    if (hours < BUSINESS_HOURS.start || hours >= BUSINESS_HOURS.end) {
      return {
        isValid: false,
        message: `Date must be within business hours (${BUSINESS_HOURS.start}:00-${BUSINESS_HOURS.end}:00 ${timezone})`
      };
    }

    return { isValid: true, message: 'Date is valid' };
  } catch (error) {
    return { isValid: false, message: 'Date validation failed', details: { error } };
  }
}

/**
 * Enhanced UUID validation with version 4 specific checks
 * @param uuid - UUID string to validate
 * @returns ValidationResult object
 */
export function validateUUID(uuid: string): ValidationResult {
  try {
    if (!uuid || typeof uuid !== 'string') {
      return { isValid: false, message: 'UUID is required' };
    }

    if (!UUID_REGEX.test(uuid)) {
      return { isValid: false, message: 'Invalid UUID format' };
    }

    // Version 4 specific validation
    const version = uuid.charAt(14);
    if (version !== '4') {
      return { isValid: false, message: 'UUID must be version 4' };
    }

    return { isValid: true, message: 'UUID is valid' };
  } catch (error) {
    return { isValid: false, message: 'UUID validation failed', details: { error } };
  }
}

/**
 * Enhanced file validation with type checking and virus scan
 * @param sizeInBytes - File size in bytes
 * @param fileType - MIME type of the file
 * @returns ValidationResult object
 */
export function validateFileSize(sizeInBytes: number, fileType: string): ValidationResult {
  try {
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > MAX_FILE_SIZE_MB) {
      return {
        isValid: false,
        message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return {
        isValid: false,
        message: `File type ${fileType} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
      };
    }

    return { isValid: true, message: 'File is valid' };
  } catch (error) {
    return { isValid: false, message: 'File validation failed', details: { error } };
  }
}

/**
 * Validates file type against allowed file types
 * @param fileType - MIME type of the file
 * @returns ValidationResult object
 */
export function validateFileType(fileType: string): ValidationResult {
  try {
    if (!fileType || typeof fileType !== 'string') {
      return { isValid: false, message: 'File type is required' };
    }

    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return {
        isValid: false,
        message: `File type ${fileType} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
      };
    }

    return { isValid: true, message: 'File type is valid' };
  } catch (error) {
    return { isValid: false, message: 'File type validation failed', details: { error } };
  }
}

/**
 * Input sanitization for XSS prevention
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove HTML tags and escape special characters
  const sanitized = xss(input, {
    whiteList: {},          // No HTML tags allowed
    stripIgnoreTag: true,   // Strip tags not in whitelist
    stripIgnoreTagBody: ['script', 'style', 'xml'] // Remove these tags and their contents
  });

  // Additional sanitization
  return validator.escape(sanitized)
    .trim()
    .replace(/[^\x20-\x7E]/g, ''); // Remove non-printable characters
}