// @package zod v3.21.4
import { z } from 'zod';

// Import types and utilities
import { DocumentTypes } from '../../types/document.types';
import { validateDocument } from '../../utils/validation.util';
import { handleError } from '../../utils/error.util';

/**
 * Human Tasks:
 * 1. Verify that document validation rules align with business requirements
 * 2. Ensure document category validation matches the allowed categories in the system
 * 3. Review document title length and format requirements
 */

/**
 * Requirement: Document Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/Core Features
 * Description: Implements validation schema for document data to ensure data integrity
 */
const documentInputSchema = z.object({
  documentId: z.string().uuid({
    message: "Document ID must be a valid UUID"
  }),
  title: z.string()
    .min(1, "Document title cannot be empty")
    .max(255, "Document title cannot exceed 255 characters")
    .refine(title => /^[\w\s\-\.]+$/.test(title), {
      message: "Document title can only contain letters, numbers, spaces, hyphens, and periods"
    }),
  category: z.string()
    .refine(cat => ['medical', 'financial', 'legal', 'personal'].includes(cat), {
      message: "Invalid document category. Must be one of: medical, financial, legal, personal"
    })
});

/**
 * Requirement: Data Validation
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Validates document input data to prevent invalid or malicious inputs
 * 
 * @param input - The document input data to validate
 * @returns boolean indicating if the input is valid
 */
export const validateDocumentInput = (input: any): boolean => {
  try {
    // First validate using zod schema
    documentInputSchema.parse(input);

    // Then validate using the utility function that checks against DocumentTypes interface
    if (!validateDocument(input)) {
      handleError(new Error('Document validation failed: Invalid document structure'));
      return false;
    }

    // Additional validation for document metadata if present
    if (input.metadata) {
      // Ensure metadata is an object
      if (typeof input.metadata !== 'object' || Array.isArray(input.metadata)) {
        handleError(new Error('Document validation failed: Metadata must be an object'));
        return false;
      }

      // Validate required metadata fields
      const requiredMetadataFields = ['version', 'size', 'mimeType', 'originalName'];
      for (const field of requiredMetadataFields) {
        if (!(field in input.metadata)) {
          handleError(new Error(`Document validation failed: Missing required metadata field '${field}'`));
          return false;
        }
      }

      // Validate metadata field types
      if (
        typeof input.metadata.version !== 'string' ||
        typeof input.metadata.size !== 'number' ||
        typeof input.metadata.mimeType !== 'string' ||
        typeof input.metadata.originalName !== 'string'
      ) {
        handleError(new Error('Document validation failed: Invalid metadata field types'));
        return false;
      }
    }

    return true;
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Document validation failed'));
    return false;
  }
};