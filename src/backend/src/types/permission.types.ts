/**
 * Estate Kit - Permission Types
 * Version: 1.0.0
 * 
 * This file defines TypeScript interfaces for permission-related data structures
 * in the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Defines the data structures and types for managing permissions, enabling secure and granular access control.
 * 
 * Human Tasks:
 * 1. Ensure that the access levels defined in the system match these types
 * 2. Verify that all resource types are properly documented in the system
 * 3. Confirm that the timestamp handling aligns with the database configuration
 */

import { delegateId, permissions, role } from './delegate.types';

/**
 * Interface defining the structure of a permission object
 * Used for implementing role-based access control throughout the system
 */
export interface PermissionTypes {
  /** Unique identifier for the permission */
  permissionId: string;

  /** Type of resource this permission applies to (e.g., 'document', 'profile', 'medical') */
  resourceType: string;

  /** Level of access granted (e.g., 'read', 'write', 'manage') */
  accessLevel: string;

  /** Timestamp when the permission was created */
  createdAt: Date;

  /** Timestamp when the permission was last updated */
  updatedAt: Date;
}

/**
 * Interface defining the structure of permissions associated with a user
 * Used to manage user-specific permissions without creating circular dependencies
 */
export interface UserPermissions {
  /** Unique identifier for the user */
  userId: string;

  /** Array of permissions assigned to the user */
  permissions: PermissionTypes[];
}

/**
 * Type guard to validate if an object conforms to the PermissionTypes interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid PermissionTypes
 */
export function isPermissionTypes(obj: any): obj is PermissionTypes {
  return (
    typeof obj === 'object' &&
    typeof obj.permissionId === 'string' &&
    typeof obj.resourceType === 'string' &&
    typeof obj.accessLevel === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

/**
 * Type guard to validate if an object conforms to the UserPermissions interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid UserPermissions
 */
export function isUserPermissions(obj: any): obj is UserPermissions {
  return (
    typeof obj === 'object' &&
    typeof obj.userId === 'string' &&
    Array.isArray(obj.permissions) &&
    obj.permissions.every((permission: any) => isPermissionTypes(permission))
  );
}

/**
 * Enum defining the standard access levels available in the system
 * Used to ensure consistent access level values across the application
 */
export enum AccessLevel {
  READ = 'read',
  WRITE = 'write',
  MANAGE = 'manage',
  ADMIN = 'admin'
}

/**
 * Enum defining the available resource types in the system
 * Used to ensure consistent resource type values across the application
 */
export enum ResourceType {
  DOCUMENT = 'document',
  PROFILE = 'profile',
  MEDICAL = 'medical',
  FINANCIAL = 'financial',
  LEGAL = 'legal'
}