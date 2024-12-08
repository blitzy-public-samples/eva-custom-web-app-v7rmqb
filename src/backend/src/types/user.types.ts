/**
 * Estate Kit - User Types
 * Version: 1.0.0
 * 
 * This file defines TypeScript interfaces and types for user-related data structures
 * in the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - User Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Defines the data structures and types for managing user accounts, profiles, and related operations.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Supports role-based access control by defining types for user roles and permissions.
 * 
 * Human Tasks:
 * 1. Verify that user roles ('owner', 'delegate', 'admin') align with business requirements
 * 2. Ensure email validation patterns match security requirements
 * 3. Review permission inheritance rules for each role
 */

import { AuditLog } from './audit.types';
import { DelegateTypes } from './delegate.types';
import { PermissionTypes } from './permission.types';
import { DocumentTypes } from './document.types';
import { UserSubscription } from './subscription.types';

/**
 * Enum defining standard user roles in the system
 * Used to ensure consistent role assignment across the application
 */
export enum UserRole {
  OWNER = 'owner',
  DELEGATE = 'delegate',
  ADMIN = 'admin'
}

/**
 * Interface defining the structure of user preferences
 * Stores user-specific settings and customizations
 */
export interface UserPreferences {
  /** Preferred notification method */
  notificationPreference: 'email' | 'sms' | 'both';
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system';
  /** Preferred language */
  language: string;
  /** Timezone for date/time display */
  timezone: string;
}

/**
 * Interface defining the structure of user contact information
 * Stores various methods of contacting the user
 */
export interface UserContact {
  /** Primary email address */
  email: string;
  /** Verified status of email */
  emailVerified: boolean;
  /** Phone number with country code */
  phone?: string;
  /** Verified status of phone */
  phoneVerified?: boolean;
  /** Mailing address */
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

/**
 * Main interface defining the structure of a user object
 * Implements core user management requirements
 */
export interface UserTypes {
  /** Unique identifier for the user */
  userId: string;

  /** User's email address - primary identifier for authentication */
  email: string;

  /** User's full name */
  name: string;

  /** User's role in the system */
  role: 'owner' | 'delegate' | 'admin';

  /** Array of permissions assigned to the user */
  permissions: PermissionTypes[];

  /** Array of user's active subscriptions */
  subscriptions: UserSubscription[];

  /** Array of documents owned by or shared with the user */
  documents: DocumentTypes[];

  /** Array of audit logs related to the user's actions */
  auditLogs: AuditLog[];
}

/**
 * Type guard to validate if an object conforms to the UserTypes interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid UserTypes
 */
export function isUserTypes(obj: any): obj is UserTypes {
  return (
    typeof obj === 'object' &&
    typeof obj.userId === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.name === 'string' &&
    (obj.role === 'owner' || obj.role === 'delegate' || obj.role === 'admin') &&
    Array.isArray(obj.permissions) &&
    Array.isArray(obj.subscriptions) &&
    Array.isArray(obj.documents) &&
    Array.isArray(obj.auditLogs)
  );
}

/**
 * Interface extending UserTypes with delegate-specific information
 * Used when a user acts as a delegate for another user
 */
export interface DelegateUser extends UserTypes {
  /** Delegate-specific information */
  delegateInfo: DelegateTypes;
}

/**
 * Type guard to validate if an object conforms to the DelegateUser interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DelegateUser
 */
export function isDelegateUser(obj: any): obj is DelegateUser {
  return (
    isUserTypes(obj) &&
    obj.role === 'delegate' &&
    typeof obj.delegateInfo === 'object' &&
    typeof obj.delegateInfo.delegateId === 'string'
  );
}