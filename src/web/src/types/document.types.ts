/**
 * @fileoverview TypeScript type definitions for document-related data structures in Estate Kit.
 * Implements secure document management, role-based access control, and PIPEDA-compliant metadata.
 * @version 1.0.0
 */

/**
 * Comprehensive enumeration of document categories in the estate planning system.
 * Used for role-based access control and document organization.
 */
export enum DocumentType {
  MEDICAL = 'MEDICAL',
  FINANCIAL = 'FINANCIAL',
  LEGAL = 'LEGAL',
  PERSONAL = 'PERSONAL',
  INSURANCE = 'INSURANCE',
  TAX = 'TAX'
}

/**
 * Enhanced enumeration of document states throughout the upload and processing lifecycle.
 * Tracks document status from initial upload through encryption and completion.
 */
export enum DocumentStatus {
  PENDING = 'PENDING',       // Document registered but upload not started
  UPLOADING = 'UPLOADING',   // Document actively uploading to server
  PROCESSING = 'PROCESSING', // Server processing document (virus scan, validation)
  ENCRYPTING = 'ENCRYPTING', // Document undergoing encryption
  COMPLETED = 'COMPLETED',   // Document successfully processed and stored
  ERROR = 'ERROR',          // Error occurred during processing
  DELETED = 'DELETED'       // Document marked as deleted
}

/**
 * Enumeration of document encryption states.
 * Tracks the encryption status of documents.
 */
export enum EncryptionStatus {
  UNENCRYPTED = 'UNENCRYPTED',
  ENCRYPTING = 'ENCRYPTING',
  ENCRYPTED = 'ENCRYPTED',
  FAILED = 'FAILED'
}

/**
 * Comprehensive interface for document metadata including security and compliance information.
 * Implements PIPEDA compliance requirements for data handling.
 */
export interface DocumentMetadata {
  fileName: string;          // Original filename
  fileSize: number;         // File size in bytes
  mimeType: string;         // MIME type of the document
  uploadedAt: Date;         // Timestamp of initial upload
  lastModified: Date;       // Last modification timestamp
  encryptionStatus: boolean; // Whether document is encrypted
  checksumSHA256: string;   // SHA-256 checksum for integrity verification
  storageLocation: string;  // S3 storage location identifier
  retentionPeriod: number;  // Retention period in days
}

/**
 * Interface for document access control and audit tracking.
 * Implements role-based access control and audit requirements.
 */
export interface DocumentAccessControl {
  delegateIds: string[];           // Array of delegate user IDs with access
  accessLevel: string;             // Access level (READ, WRITE, ADMIN)
  expiresAt: Date | null;          // Optional access expiration date
  lastAccessedBy: string;          // ID of user who last accessed document
  lastAccessedAt: Date;            // Timestamp of last access
}

/**
 * Comprehensive interface for document data structure.
 * Central type definition for document management in Estate Kit.
 */
export interface Document {
  id: string;                      // Unique document identifier
  userId: string;                  // Owner's user ID
  title: string;                   // Document title
  type: DocumentType;              // Document category
  status: DocumentStatus;          // Current document status
  metadata: DocumentMetadata;      // Document metadata
  accessControl: DocumentAccessControl; // Access control settings
  createdAt: Date;                // Creation timestamp
  updatedAt: Date;                // Last update timestamp
  version: number;                // Document version number
}

/**
 * Enhanced interface for tracking document upload progress.
 * Includes encryption and processing status information.
 */
export interface DocumentUploadState {
  documentId: string;             // ID of document being uploaded
  progress: number;               // Upload progress (0-100)
  status: DocumentStatus;         // Current upload status
  error: string | null;           // Error message if failed
  retryCount: number;             // Number of upload retry attempts
  encryptionProgress: number;     // Encryption progress (0-100)
}

/**
 * Interface for document upload request payload.
 * Defines required parameters for initiating document upload.
 */
export interface DocumentUploadRequest {
  title: string;                  // Document title
  type: DocumentType;             // Document category
  file: File;                     // File object to upload
  metadata: Omit<DocumentMetadata, 'uploadedAt' | 'lastModified'>; // Metadata excluding server-set fields
  accessControl: Omit<DocumentAccessControl, 'lastAccessedBy' | 'lastAccessedAt'>; // Access control excluding audit fields
}