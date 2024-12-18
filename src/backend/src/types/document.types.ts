// @ts-check
import { UUID } from './user.types';  // Internal import for UUID type
import { ResourceType } from './permission.types';  // Internal import for permission types
import { UUID as UUID_TYPE } from 'crypto';  // Version: latest - Used for unique identifier types

/**
 * Enum defining types of documents stored in the system.
 * Maps to different categories of estate planning documents.
 */
export enum DocumentType {
    MEDICAL = 'MEDICAL',     // Healthcare directives, medical records
    FINANCIAL = 'FINANCIAL', // Financial statements, accounts, investments
    LEGAL = 'LEGAL',        // Wills, power of attorney, trusts
    PERSONAL = 'PERSONAL'    // Personal records, identification, certificates
}

/**
 * Enum defining possible document processing statuses.
 * Tracks document lifecycle from upload to completion.
 */
export enum DocumentStatus {
    PENDING = 'PENDING',         // Document uploaded, awaiting processing
    PROCESSING = 'PROCESSING',   // Document undergoing validation/encryption
    COMPLETED = 'COMPLETED',     // Document successfully processed and stored
    ERROR = 'ERROR'             // Processing failed, requires attention
}

/**
 * Enum defining supported encryption types for document storage.
 * Implements PIPEDA-compliant encryption standards.
 */
export enum EncryptionType {
    AES_256 = 'AES_256',        // AES 256-bit encryption
    KMS_MANAGED = 'KMS_MANAGED' // AWS KMS managed encryption
}

/**
 * Interface for document metadata including retention and location tracking.
 * Contains extended attributes for document management and compliance.
 */
export interface DocumentMetadata {
    fileName: string;            // Original file name
    fileSize: number;           // File size in bytes
    mimeType: string;           // MIME type for content validation
    uploadedAt: Date;           // Initial upload timestamp
    lastModified: Date;         // Last modification timestamp
    retentionPeriod: number;    // Retention period in days
    geographicLocation: string; // Storage location for data residency
}

/**
 * Interface for AWS S3 storage details with enhanced encryption support.
 * Implements secure storage requirements with encryption tracking.
 */
export interface DocumentStorageDetails {
    bucket: string;             // S3 bucket name
    key: string;                // S3 object key
    version: string;            // S3 object version ID
    encryptionType: EncryptionType; // Type of encryption used
    kmsKeyId: string;           // KMS key ID for encryption
}

/**
 * Main interface representing a document in the system.
 * Implements comprehensive document management with security features.
 */
export interface Document {
    id: UUID;                   // Unique identifier
    userId: UUID;               // Owner reference
    title: string;              // Document title
    type: DocumentType;         // Document category
    status: DocumentStatus;     // Processing status
    metadata: DocumentMetadata; // Extended metadata
    storageDetails: DocumentStorageDetails; // Storage information
    resourceType: ResourceType; // Permission resource type
    accessControl: Record<string, any>; // Access control settings
    lastAccessedAt: Date;       // Last access timestamp
    expiresAt: Date;           // Document expiration date
    createdAt: Date;           // Creation timestamp
    updatedAt: Date;           // Last update timestamp
}

/**
 * Data transfer object for document creation.
 * Contains required fields for initial document upload.
 */
export interface CreateDocumentDTO {
    title: string;              // Required document title
    type: DocumentType;         // Required document type
    file: Buffer;               // File data for upload
    metadata: Omit<DocumentMetadata, 'uploadedAt' | 'lastModified'>; // Required metadata
    retentionPeriod: number;    // Required retention period
}

/**
 * Data transfer object for document updates.
 * Supports partial updates with optional fields.
 */
export interface UpdateDocumentDTO {
    title?: string;             // Optional title update
    type?: DocumentType;        // Optional type update
    accessControl?: Record<string, any>; // Optional access control updates
    retentionPeriod?: number;   // Optional retention period update
}