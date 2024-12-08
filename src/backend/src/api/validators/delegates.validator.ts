/**
 * Estate Kit - Delegate Validator
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements validation mechanisms for delegate-related data
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Ensures the integrity and validity of delegate-related data in API requests
 * 
 * Human Tasks:
 * 1. Verify that the permission validation rules align with business requirements
 * 2. Ensure role values match the defined delegate roles in the system
 * 3. Review expiration date validation rules for compliance requirements
 */

// @package zod v3.21.4
import { z } from 'zod';
import { DelegateTypes } from '../../types/delegate.types';
import { validateDelegate } from '../../utils/validation.util';

// Zod schema for delegate permission validation
const delegatePermissionSchema = z.object({
  permissionId: z.string().uuid(),
  resourceType: z.string().min(1),
  accessLevel: z.enum(['read', 'write', 'manage'])
});

// Zod schema for delegate data validation
const delegateDataSchema = z.object({
  delegateId: z.string().uuid(),
  permissions: z.array(delegatePermissionSchema).min(1),
  role: z.enum(['executor', 'healthcare_proxy', 'financial_advisor']),
  expiresAt: z.date().min(new Date()) // Ensure expiration date is in the future
});

/**
 * Validates delegate-related input data against the DelegateTypes interface and business rules
 * @param delegate - The delegate data to validate
 * @returns boolean indicating if the delegate data is valid
 * @throws Error if validation fails with specific validation message
 */
export function validateDelegateData(delegate: DelegateTypes): boolean {
  try {
    // First validate using the utility function for basic type checking
    if (!validateDelegate(delegate)) {
      throw new Error('Invalid delegate data structure');
    }

    // Perform detailed validation using Zod schema
    delegateDataSchema.parse({
      delegateId: delegate.delegateId,
      permissions: delegate.permissions,
      role: delegate.role,
      expiresAt: delegate.expiresAt
    });

    // Additional business rule validations
    validatePermissionCombinations(delegate.permissions);
    validateRolePermissions(delegate.role, delegate.permissions);
    validateExpirationDate(delegate.expiresAt);

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validates that permission combinations are valid according to business rules
 * @param permissions - Array of delegate permissions to validate
 * @throws Error if permission combinations are invalid
 */
function validatePermissionCombinations(permissions: DelegateTypes['permissions']): void {
  // Check for duplicate resource types
  const resourceTypes = new Set<string>();
  permissions.forEach(permission => {
    if (resourceTypes.has(permission.resourceType)) {
      throw new Error(`Duplicate permission for resource type: ${permission.resourceType}`);
    }
    resourceTypes.add(permission.resourceType);
  });

  // Check for invalid access level combinations
  permissions.forEach(permission => {
    if (permission.accessLevel === 'manage' && 
        permissions.some(p => 
          p.resourceType === permission.resourceType && 
          ['read', 'write'].includes(p.accessLevel))) {
      throw new Error(`Invalid access level combination for resource type: ${permission.resourceType}`);
    }
  });
}

/**
 * Validates that permissions are appropriate for the assigned role
 * @param role - The delegate's role
 * @param permissions - Array of delegate permissions
 * @throws Error if permissions don't match role requirements
 */
function validateRolePermissions(role: string, permissions: DelegateTypes['permissions']): void {
  const rolePermissionMap = {
    'executor': ['document', 'financial', 'legal'],
    'healthcare_proxy': ['medical', 'document'],
    'financial_advisor': ['financial', 'document']
  };

  const allowedTypes = rolePermissionMap[role as keyof typeof rolePermissionMap];
  if (!allowedTypes) {
    throw new Error(`Invalid role: ${role}`);
  }

  permissions.forEach(permission => {
    if (!allowedTypes.includes(permission.resourceType)) {
      throw new Error(`Invalid resource type "${permission.resourceType}" for role "${role}"`);
    }
  });
}

/**
 * Validates the expiration date according to business rules
 * @param expiresAt - The expiration date to validate
 * @throws Error if expiration date is invalid
 */
function validateExpirationDate(expiresAt: Date): void {
  const now = new Date();
  const maxExpirationDate = new Date();
  maxExpirationDate.setFullYear(maxExpirationDate.getFullYear() + 5); // Max 5 years in the future

  if (expiresAt <= now) {
    throw new Error('Expiration date must be in the future');
  }

  if (expiresAt > maxExpirationDate) {
    throw new Error('Expiration date cannot be more than 5 years in the future');
  }
}