/**
 * Estate Kit - Delegate Types
 * Version: 1.0.0
 * 
 * This file defines TypeScript interfaces for delegate-related data structures
 * in the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Defines data structures for managing delegate access control
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Supports RBAC by defining delegate roles and permissions
 */

/**
 * Interface representing a permission assigned to a delegate
 * Used to define granular access control for specific resources
 */
export interface DelegatePermission {
  /** Unique identifier for the permission */
  permissionId: string;

  /** Type of resource this permission applies to (e.g., 'document', 'profile', 'medical') */
  resourceType: string;

  /** Level of access granted (e.g., 'read', 'write', 'manage') */
  accessLevel: string;
}

/**
 * Main interface defining the structure of a delegate object
 * Used for managing delegate access and permissions throughout the system
 */
export interface DelegateTypes {
  /** Unique identifier for the delegate */
  delegateId: string;

  /** Identifier of the primary account owner who granted delegate access */
  ownerId: string;

  /** Array of permissions granted to this delegate */
  permissions: Array<DelegatePermission>;

  /** Role assigned to the delegate (e.g., 'executor', 'healthcare_proxy', 'financial_advisor') */
  role: string;

  /** Date when the delegate access expires */
  expiresAt: Date;
}

/**
 * Type guard to validate if an object conforms to the DelegateTypes interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DelegateTypes
 */
export function isDelegateTypes(obj: any): obj is DelegateTypes {
  return (
    typeof obj === 'object' &&
    typeof obj.delegateId === 'string' &&
    typeof obj.ownerId === 'string' &&
    Array.isArray(obj.permissions) &&
    obj.permissions.every((permission: any) =>
      typeof permission === 'object' &&
      typeof permission.permissionId === 'string' &&
      typeof permission.resourceType === 'string' &&
      typeof permission.accessLevel === 'string'
    ) &&
    typeof obj.role === 'string' &&
    obj.expiresAt instanceof Date
  );
}

/**
 * Type guard to validate if an object conforms to the DelegatePermission interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DelegatePermission
 */
export function isDelegatePermission(obj: any): obj is DelegatePermission {
  return (
    typeof obj === 'object' &&
    typeof obj.permissionId === 'string' &&
    typeof obj.resourceType === 'string' &&
    typeof obj.accessLevel === 'string'
  );
}