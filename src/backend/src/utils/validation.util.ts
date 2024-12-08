// @package zod v3.21.4
import { z } from 'zod';

// Import types from internal modules
import { AuditLog, AuditActionType, AuditSeverity, AuditStatus } from '../types/audit.types';
import { DelegateTypes } from '../types/delegate.types';
import { PermissionTypes, AccessLevel, ResourceType } from '../types/permission.types';
import { DocumentTypes, DocumentStatus, DocumentCategory } from '../types/document.types';
import { UserSubscription } from '../types/subscription.types';
import { UserTypes, UserRole } from '../types/user.types';

/**
 * Requirement: Data Validation
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Implements validation mechanisms to ensure data integrity and prevent invalid inputs
 */

// Zod schema for AuditLog validation
const auditLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.nativeEnum(AuditActionType),
  timestamp: z.date(),
  details: z.record(z.any()),
  severity: z.nativeEnum(AuditSeverity),
  status: z.nativeEnum(AuditStatus),
  metadata: z.object({}).passthrough(),
  sourceIp: z.string().ip().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
  resourceIds: z.array(z.string()).optional()
});

// Zod schema for DelegateTypes validation
const delegateSchema = z.object({
  delegateId: z.string().uuid(),
  permissions: z.array(z.object({
    permissionId: z.string().uuid(),
    resourceType: z.string(),
    accessLevel: z.string()
  })),
  role: z.string()
});

// Zod schema for PermissionTypes validation
const permissionSchema = z.object({
  permissionId: z.string().uuid(),
  resourceType: z.nativeEnum(ResourceType),
  accessLevel: z.nativeEnum(AccessLevel)
});

// Zod schema for DocumentTypes validation
const documentSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().min(1),
  category: z.nativeEnum(DocumentCategory),
  status: z.nativeEnum(DocumentStatus),
  metadata: z.record(z.any())
});

// Zod schema for UserSubscription validation
const userSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  status: z.enum(['active', 'inactive', 'cancelled'])
});

// Zod schema for UserTypes validation
const userSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole)
});

/**
 * Validates an audit log entry against the AuditLog interface
 * @param auditLog - The audit log entry to validate
 * @returns boolean indicating if the audit log entry is valid
 */
export function validateAuditLog(auditLog: any): boolean {
  try {
    auditLogSchema.parse(auditLog);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a delegate object against the DelegateTypes interface
 * @param delegate - The delegate object to validate
 * @returns boolean indicating if the delegate object is valid
 */
export function validateDelegate(delegate: any): boolean {
  try {
    delegateSchema.parse(delegate);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a permission object against the PermissionTypes interface
 * @param permission - The permission object to validate
 * @returns boolean indicating if the permission object is valid
 */
export function validatePermission(permission: any): boolean {
  try {
    permissionSchema.parse(permission);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a document object against the DocumentTypes interface
 * @param document - The document object to validate
 * @returns boolean indicating if the document object is valid
 */
export function validateDocument(document: any): boolean {
  try {
    documentSchema.parse(document);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a user subscription object against the UserSubscription interface
 * @param subscription - The subscription object to validate
 * @returns boolean indicating if the subscription object is valid
 */
export function validateUserSubscription(subscription: any): boolean {
  try {
    userSubscriptionSchema.parse(subscription);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a user object against the UserTypes interface
 * @param user - The user object to validate
 * @returns boolean indicating if the user object is valid
 */
export function validateUser(user: any): boolean {
  try {
    userSchema.parse(user);
    return true;
  } catch (error) {
    return false;
  }
}