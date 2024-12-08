/**
 * Estate Kit - Audit Types
 * 
 * This file defines TypeScript interfaces for audit logging in the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements logging mechanisms to track system activities and ensure compliance with security standards.
 */

import { delegateId, permissions, role } from './delegate.types';

/**
 * Represents the structure of user data for audit logging.
 * Localized to avoid circular dependency with user.types.ts
 */
interface UserTypes {
  userId: string;
  email: string;
  name: string;
}

/**
 * Represents the type of action being audited
 */
export enum AuditActionType {
  // User-related actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_PROFILE_UPDATE = 'USER_PROFILE_UPDATE',
  USER_PASSWORD_CHANGE = 'USER_PASSWORD_CHANGE',
  USER_MFA_UPDATE = 'USER_MFA_UPDATE',

  // Document-related actions
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_VIEW = 'DOCUMENT_VIEW',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_SHARE = 'DOCUMENT_SHARE',

  // Delegate-related actions
  DELEGATE_INVITE = 'DELEGATE_INVITE',
  DELEGATE_ACCEPT = 'DELEGATE_ACCEPT',
  DELEGATE_REMOVE = 'DELEGATE_REMOVE',
  DELEGATE_PERMISSION_UPDATE = 'DELEGATE_PERMISSION_UPDATE',

  // System-related actions
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_CONFIG_UPDATE = 'SYSTEM_CONFIG_UPDATE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE'
}

/**
 * Represents the severity level of the audit log entry
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Represents the status of the audited action
 */
export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED'
}

/**
 * Interface representing the metadata for delegate-related audit events
 */
interface DelegateAuditMetadata {
  delegateId: typeof delegateId;
  role: typeof role;
  permissions: typeof permissions;
  expiryDate?: Date;
}

/**
 * Interface representing the metadata for document-related audit events
 */
interface DocumentAuditMetadata {
  documentId: string;
  documentType: string;
  documentName: string;
  documentSize?: number;
  documentFormat?: string;
}

/**
 * Interface representing the metadata for user-related audit events
 */
interface UserAuditMetadata {
  userDetails: Partial<UserTypes>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Interface representing the metadata for system-related audit events
 */
interface SystemAuditMetadata {
  component: string;
  environment: string;
  version?: string;
  errorCode?: string;
  stackTrace?: string;
}

/**
 * Union type for all possible audit metadata types
 */
export type AuditMetadata = 
  | DelegateAuditMetadata 
  | DocumentAuditMetadata 
  | UserAuditMetadata 
  | SystemAuditMetadata;

/**
 * Main interface defining the structure of an audit log entry
 */
export interface AuditLog {
  /** Unique identifier for the audit log entry */
  id: string;

  /** ID of the user who performed the action */
  userId: string;

  /** Type of action performed */
  action: AuditActionType;

  /** Timestamp when the action occurred */
  timestamp: Date;

  /** Additional details about the action */
  details: Record<string, any>;

  /** Severity level of the audit event */
  severity: AuditSeverity;

  /** Status of the audited action */
  status: AuditStatus;

  /** Specific metadata based on the action type */
  metadata: AuditMetadata;

  /** Source IP address of the request */
  sourceIp?: string;

  /** User agent string of the client */
  userAgent?: string;

  /** Request ID for correlation */
  requestId?: string;

  /** Related resource identifiers */
  resourceIds?: string[];
}

/**
 * Type guard to validate if an object conforms to the AuditLog interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid AuditLog
 */
export function isAuditLog(obj: any): obj is AuditLog {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.action === 'string' &&
    obj.timestamp instanceof Date &&
    typeof obj.details === 'object' &&
    typeof obj.severity === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.metadata === 'object'
  );
}