// @package zod v3.21.4
import { z } from 'zod';
import { UserTypes } from '../../types/user.types';
import { validateUser } from '../../utils/validation.util';
import { handleError } from '../../utils/error.util';

/**
 * Human Tasks:
 * 1. Ensure email validation patterns align with security requirements
 * 2. Verify that role-based validation rules match business requirements
 * 3. Review permission validation rules for each user role
 */

/**
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements validation mechanisms for user-related API requests
 * to ensure data integrity and compliance with business rules.
 */

/**
 * Requirement: Data Validation
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Ensures that user-related data is validated against predefined
 * schemas and business rules.
 */

// Zod schema for validating user request payload
const userRequestSchema = z.object({
  userId: z.string().uuid().optional(), // Optional for new user creation
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  role: z.enum(['owner', 'delegate', 'admin'], {
    errorMap: () => ({ message: 'Invalid role. Must be one of: owner, delegate, admin' })
  }),
  permissions: z.array(z.string().uuid())
    .min(1, 'At least one permission is required')
    .max(50, 'Maximum 50 permissions allowed')
});

/**
 * Validates the incoming user-related API request payload.
 * 
 * @param requestBody - The request payload to validate
 * @returns true if validation passes, throws error if validation fails
 */
export const validateUserRequest = (requestBody: any): boolean => {
  try {
    // First validate against Zod schema
    userRequestSchema.parse(requestBody);

    // Create a UserTypes object for additional validation
    const userObject: UserTypes = {
      userId: requestBody.userId || '',
      email: requestBody.email,
      name: requestBody.name,
      role: requestBody.role,
      permissions: requestBody.permissions,
      subscriptions: [], // Will be populated by subscription service
      documents: [], // Will be populated by document service
      auditLogs: [] // Will be populated by audit service
    };

    // Perform additional validation using the validation utility
    if (!validateUser(userObject)) {
      throw new Error('User object failed validation');
    }

    // Role-specific validation
    if (requestBody.role === 'owner') {
      // Owners must have all base permissions
      if (!requestBody.permissions.includes('base_profile_access')) {
        throw new Error('Owner role requires base profile access permission');
      }
    }

    if (requestBody.role === 'delegate') {
      // Delegates must have limited permissions
      if (requestBody.permissions.includes('system_admin')) {
        throw new Error('Delegate role cannot have system admin permissions');
      }
    }

    if (requestBody.role === 'admin') {
      // Admins must have admin permissions
      if (!requestBody.permissions.includes('system_admin')) {
        throw new Error('Admin role requires system admin permission');
      }
    }

    return true;
  } catch (error) {
    // Handle and log the validation error
    handleError(error as Error);
    throw error;
  }
};