/**
 * Estate Kit - Frontend Document Types
 * Version: 1.0.0
 * 
 * This file defines TypeScript types and interfaces for document-related data structures
 * used in the Estate Kit web application.
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Defines the data structures and types for managing documents, including metadata and categories
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of document metadata through encryption and role-based access control
 * 
 * Human Tasks:
 * 1. Verify that document types align with backend API responses
 * 2. Ensure proper date handling for document timestamps in UI components
 * 3. Review metadata display requirements for each document category
 */

import { DocumentTypes as BackendDocumentTypes } from '../../backend/src/types/document.types';
import { AuthTypes } from './auth.types';
import { DelegateTypes } from './delegate.types';

/**
 * Enum defining standard document status values
 * Ensures consistent status representation across the frontend
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  ARCHIVED = 'archived'
}

/**
 * Enum defining document categories
 * Maps to backend document categories for consistency
 */
export enum DocumentCategory {
  MEDICAL = 'medical',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  PERSONAL = 'personal'
}

/**
 * Interface for document metadata in the frontend
 * Provides type safety for metadata handling in UI components
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
 * Main interface defining the structure of a document object in the frontend
 * Implements the core document management requirements
 */
export interface DocumentTypes extends BackendDocumentTypes {
  /** Unique identifier for the document */
  documentId: string;

  /** Document title */
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
 * Interface for document with associated access information
 * Used for displaying document access details in the UI
 */
export interface DocumentWithAccess extends DocumentTypes {
  /** User role that has access to this document */
  accessRole: AuthTypes['role'];
  /** Delegate information if accessed through delegation */
  delegateInfo?: Pick<DelegateTypes, 'delegateId' | 'permissions'>;
}

/**
 * Type guard to validate if an object conforms to the DocumentTypes interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DocumentTypes
 */
export function isDocumentTypes(obj: any): obj is DocumentTypes {
  return (
    typeof obj === 'object' &&
    typeof obj.documentId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.status === 'string' &&
    obj.metadata && typeof obj.metadata === 'object' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

/**
 * Type guard to validate if an object conforms to the DocumentWithAccess interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DocumentWithAccess
 */
export function isDocumentWithAccess(obj: any): obj is DocumentWithAccess {
  return (
    isDocumentTypes(obj) &&
    ['user', 'admin', 'delegate'].includes(obj.accessRole) &&
    (!obj.delegateInfo || (
      typeof obj.delegateInfo === 'object' &&
      typeof obj.delegateInfo.delegateId === 'string' &&
      Array.isArray(obj.delegateInfo.permissions)
    ))
  );
}