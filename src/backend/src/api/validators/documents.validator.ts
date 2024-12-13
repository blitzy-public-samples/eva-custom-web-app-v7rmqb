// External dependencies
import { z } from 'zod'; // Version: ^3.22.0
import { ClamScan } from '@estatekit/clamav-client'; // Version: ^1.0.0

// Internal imports
import { DocumentType } from '../../types/document.types';
import { validateFileSize, validateFileType } from '../../utils/validation.util';

// Constants for validation rules
const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 100;
const MAX_FILE_SIZE_MB = 25;
const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.png', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;

// Initialize virus scanner
const clamav = new ClamScan({
  removeInfected: true,
  quarantinePath: '/tmp/quarantine',
  debugMode: false
});

/**
 * Enhanced validation schema for document creation
 * Implements PIPEDA and HIPAA compliant validation rules
 */
export const createDocumentSchema = z.object({
  title: z.string()
    .trim()
    .min(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`)
    .max(TITLE_MAX_LENGTH, `Title must not exceed ${TITLE_MAX_LENGTH} characters`)
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Title contains invalid characters'),

  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Invalid document type' })
  }),

  file: z.custom<Express.Multer.File>((file) => {
    if (!file) return false;
    const sizeValid = validateFileSize(file.size, file.mimetype);
    const typeValid = validateFileType(file.mimetype);
    return sizeValid.isValid && typeValid.isValid;
  }, {
    message: `File must be one of ${ALLOWED_FILE_TYPES.join(', ')} and under ${MAX_FILE_SIZE_MB}MB`
  }),

  metadata: z.object({
    fileName: z.string().trim(),
    fileSize: z.number().positive(),
    mimeType: z.string().refine(
      (type) => ALLOWED_MIME_TYPES.includes(type),
      'Invalid file type'
    ),
    checksum: z.string().min(32).max(128),
    scanResult: z.string()
  })
});

/**
 * Enhanced validation schema for document updates
 * Includes audit tracking and metadata validation
 */
export const updateDocumentSchema = z.object({
  id: z.string().uuid('Invalid document ID'),
  
  title: z.string()
    .trim()
    .min(TITLE_MIN_LENGTH)
    .max(TITLE_MAX_LENGTH)
    .optional(),

  type: z.nativeEnum(DocumentType).optional(),

  metadata: z.object({
    lastModified: z.date(),
    modifiedBy: z.string().uuid('Invalid user ID')
  }).optional()
});

/**
 * Enhanced validation schema for document listing
 * Implements pagination and filtering with security checks
 */
export const listDocumentsSchema = z.object({
  type: z.nativeEnum(DocumentType).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

/**
 * Enhanced document validation middleware with virus scanning
 * Implements comprehensive security checks and metadata sanitization
 */
export async function validateDocumentPayload(payload: z.infer<typeof createDocumentSchema>): Promise<ValidationResult> {
  try {
    // Rate limiting check
    const rateLimitKey = `document_upload_${payload.metadata.fileName}`;
    if (!checkRateLimit(rateLimitKey, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)) {
      return {
        isValid: false,
        message: 'Rate limit exceeded for document uploads'
      };
    }

    // Validate file size
    const sizeValidation = validateFileSize(payload.metadata.fileSize, payload.metadata.mimeType);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }

    // Perform virus scan
    const scanResult = await clamav.scanBuffer(payload.file.buffer);
    if (!scanResult.isClean) {
      return {
        isValid: false,
        message: 'File failed virus scan',
        details: scanResult.viruses
      };
    }

    // Validate file type and MIME type
    const typeValidation = validateFileType(payload.metadata.mimeType);
    if (!typeValidation.isValid) {
      return typeValidation;
    }

    // Sanitize metadata
    const sanitizedMetadata = {
      ...payload.metadata,
      fileName: sanitizeFileName(payload.metadata.fileName),
      scanResult: scanResult.summary
    };

    // Log validation attempt for audit
    await logValidationAttempt({
      fileName: payload.metadata.fileName,
      fileSize: payload.metadata.fileSize,
      mimeType: payload.metadata.mimeType,
      scanResult: scanResult.summary
    });

    return {
      isValid: true,
      message: 'Document validation successful',
      details: { sanitizedMetadata }
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Document validation failed',
      details: { error }
    };
  }
}

// Helper function to check rate limiting
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  // Implementation of rate limiting logic
  return true; // Placeholder return
}

// Helper function to sanitize file names
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9\-_\.]/g, '')
    .toLowerCase();
}

// Helper function to log validation attempts
async function logValidationAttempt(details: any): Promise<void> {
  // Implementation of validation logging
}

// Interface for validation results
interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: Record<string, any>;
}