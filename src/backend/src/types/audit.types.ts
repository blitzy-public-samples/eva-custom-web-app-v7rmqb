/**
 * Type definitions for Estate Kit's audit logging system
 * Supports PIPEDA and HIPAA compliance requirements for security monitoring,
 * data privacy controls, and access logging.
 * @version 1.0.0
 */

/**
 * Enumeration of all auditable events in the system
 * Used for tracking user actions, document operations, and security events
 */
export enum AuditEventType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_ACCESS = 'DOCUMENT_ACCESS',
  DELEGATE_INVITE = 'DELEGATE_INVITE',
  DELEGATE_ACCESS = 'DELEGATE_ACCESS',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  SUBSCRIPTION_CHANGE = 'SUBSCRIPTION_CHANGE'
}

/**
 * Enumeration of audit event severity levels
 * Used for categorizing and filtering security events
 */
export enum AuditSeverity {
  INFO = 'INFO',           // Normal operational events
  WARNING = 'WARNING',     // Potential security concerns
  ERROR = 'ERROR',        // Security violations or failures
  CRITICAL = 'CRITICAL'   // Severe security incidents
}

/**
 * Interface defining the structure of an audit log entry
 * Compliant with PIPEDA and HIPAA requirements for comprehensive logging
 */
export interface AuditLogEntry {
  /** Type of the audited event */
  eventType: AuditEventType;
  
  /** Severity level of the event */
  severity: AuditSeverity;
  
  /** ID of the user who performed the action */
  userId: string;
  
  /** ID of the affected resource (document, delegate, etc.) */
  resourceId: string | null;
  
  /** Type of resource being accessed/modified */
  resourceType: string;
  
  /** IP address of the request */
  ipAddress: string;
  
  /** User agent string from the request */
  userAgent: string;
  
  /** Additional event-specific details */
  details: Record<string, any>;
  
  /** Automatically added by the system */
  timestamp?: Date;
}

/**
 * Interface defining filter criteria for querying audit logs
 * Supports compliance requirements for audit trail review
 */
export interface AuditFilter {
  /** Filter by specific event types */
  eventType?: AuditEventType[];
  
  /** Filter by severity levels */
  severity?: AuditSeverity[];
  
  /** Filter by specific user */
  userId?: string;
  
  /** Filter by resource type */
  resourceType?: string;
  
  /** Start date for the date range filter */
  startDate?: Date;
  
  /** End date for the date range filter */
  endDate?: Date;
  
  /** Page number for pagination */
  page?: number;
  
  /** Number of records per page */
  limit?: number;
}