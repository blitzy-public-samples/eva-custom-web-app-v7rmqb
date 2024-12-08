/**
 * Estate Kit - Frontend Delegate Types
 * Version: 1.0.0
 * 
 * This file defines TypeScript types and interfaces for delegate-related data structures
 * used in the Estate Kit web application.
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Defines the data structures and types for managing delegate access control
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Supports RBAC by defining delegate roles and permissions
 * 
 * Human Tasks:
 * 1. Verify that the frontend delegate types align with backend API responses
 * 2. Ensure proper date handling for expiresAt field in the UI components
 * 3. Confirm that all role values are properly mapped in the UI
 */

import { DelegateTypes as BackendDelegateTypes } from '../../backend/src/types/delegate.types';
import { PermissionTypes } from '../../backend/src/types/permission.types';
import { AuthTypes } from './auth.types';

/**
 * Interface representing a delegate permission in the frontend
 * Mirrors the backend permission structure for consistency
 */
export interface DelegatePermission {
  /** Unique identifier for the permission */
  permissionId: string;

  /** Type of resource this permission applies to */
  resourceType: string;

  /** Level of access granted */
  accessLevel: string;
}

/**
 * Main interface defining the structure of a delegate object in the frontend
 * Extends the backend delegate type structure with frontend-specific properties
 */
export interface DelegateTypes extends Omit<BackendDelegateTypes, 'role'> {
  /** Unique identifier for the delegate */
  delegateId: string;

  /** Identifier of the primary account owner */
  ownerId: string;

  /** Array of permissions granted to this delegate */
  permissions: Array<DelegatePermission>;

  /** Role assigned to the delegate - must match AuthTypes role values */
  role: AuthTypes['role'];

  /** Date when the delegate access expires */
  expiresAt: Date;
}

/**
 * Type guard to validate if an object conforms to the frontend DelegateTypes interface
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
    ['user', 'admin', 'delegate'].includes(obj.role) &&
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