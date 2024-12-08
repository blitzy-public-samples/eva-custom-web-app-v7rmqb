/**
 * Estate Kit - Document Types
 * Version: 1.0.0
 * 
 * This file defines TypeScript interfaces and types for document-related data structures
 * in the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Defines the data structures and types for managing documents, including metadata and categories
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Implements secure document metadata handling through encryption and access control
 * 
 * Human Tasks:
 * 1. Verify that the document categories align with business requirements
 * 2. Ensure encryption keys are properly configured in the environment
 * 3. Review metadata schema requirements for each document category
 */

import { PermissionTypes } from './permission.types';

/**
 * Enum defining standard document status values
 * Used to ensure consistent status tracking across the system
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  ARCHIVED = 'archived'
}

/**
 * Enum defining document categories
 * Aligned with the ResourceType enum from permission.types.ts
 */
export enum DocumentCategory {
  MEDICAL = 'medical',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  PERSONAL = 'personal'
}

/**
 * Interface for document metadata
 * Provides flexible structure while maintaining type safety
 */
export interface DocumentMetadata {
  /** Version of the document */
  version: string;
  /** Size of the document in bytes */
  size: number;
  /** MIME type of the document */
  mimeType: string;
  /** Original filename */
  originalName: string;
  /** Custom metadata fields */
  [key: string]: any;
}

/**
 * Main interface defining the structure of a document object
 * Implements the core document management requirements
 */
export interface DocumentTypes {
  /** Unique identifier for the document */
  documentId: string;

  /** Document title - encrypted for security */
  title: string;

  /** Document category - used for organization and access control */
  category: string;

  /** Current status of the document */
  status: string;

  /** Document metadata including version, size, and custom fields */
  metadata: Record<string, any>;

  /** Timestamp when the document was created */
  createdAt: Date;

  /** Timestamp when the document was last updated */
  updatedAt: Date;
}

/**
 * Type guard to validate if an object conforms to the DocumentTypes interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DocumentTypes
 */
export function isDocumentTypes(obj: any): obj is DocumentTypes {
  return (
    validateDocument(obj) &&
    typeof obj.title === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.status === 'string' &&
    obj.metadata && typeof obj.metadata === 'object' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

/**
 * Interface for document with associated permissions
 * Combines document data with access control information
 */
export interface DocumentWithPermissions extends DocumentTypes {
  /** Array of permissions associated with the document */
  permissions: PermissionTypes[];
}

/**
 * Function to encrypt sensitive document metadata
 * @param document - Document object to process
 * @returns Document with encrypted sensitive fields
 */
export function encryptDocumentMetadata(document: DocumentTypes): DocumentTypes {
  return {
    ...document,
    title: encryptData(document.title),
    metadata: {
      ...document.metadata,
      originalName: encryptData(document.metadata.originalName)
    }
  };
}

/**
 * Function to decrypt sensitive document metadata
 * @param document - Document object with encrypted fields
 * @returns Document with decrypted sensitive fields
 */
export function decryptDocumentMetadata(document: DocumentTypes): DocumentTypes {
  return {
    ...document,
    title: decryptData(document.title),
    metadata: {
      ...document.metadata,
      originalName: decryptData(document.metadata.originalName)
    }
  };
}

/**
 * Type guard to validate if an object conforms to the DocumentWithPermissions interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DocumentWithPermissions
 */
export function isDocumentWithPermissions(obj: any): obj is DocumentWithPermissions {
  return (
    isDocumentTypes(obj) &&
    Array.isArray(obj.permissions) &&
    obj.permissions.every((permission: any) =>
      typeof permission === 'object' &&
      typeof permission.permissionId === 'string' &&
      typeof permission.accessLevel === 'string'
    )
  );
}