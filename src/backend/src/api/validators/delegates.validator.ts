// External dependencies
import { z } from 'zod'; // Version: ^3.22.0

// Internal imports
import { ResourceType, AccessLevel } from '../../types/permission.types';
import { UserRole } from '../../types/user.types';
import { DelegateStatus } from '../../types/delegate.types';
import { validateEmail } from '../../utils/validation.util';

/**
 * Validates temporal access restrictions for delegate permissions
 * Ensures access is granted only during business hours and within valid timeframes
 */
const temporalAccessSchema = z.object({
  startTime: z.date()
    .min(new Date(), 'Start time must be in the future')
    .refine(date => date.getHours() >= 9 && date.getHours() < 17, {
      message: 'Access can only be granted during business hours (9 AM - 5 PM)'
    }),
  endTime: z.date()
    .refine(date => date.getHours() >= 9 && date.getHours() < 17, {
      message: 'Access can only be granted during business hours (9 AM - 5 PM)'
    })
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime']
});

/**
 * Business hours configuration schema with timezone support
 * Enforces valid business hour restrictions for delegate access
 */
const businessHoursSchema = z.object({
  timezone: z.string()
    .refine(tz => /^(America|Canada)\/.+$/.test(tz), {
      message: 'Must be a valid Canadian timezone'
    }),
  start: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  end: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
});

/**
 * Permission schema for individual resource access control
 * Implements granular RBAC with temporal access restrictions
 */
const permissionSchema = z.object({
  resourceType: z.nativeEnum(ResourceType),
  accessLevel: z.nativeEnum(AccessLevel),
  temporalAccess: temporalAccessSchema.optional()
});

/**
 * Validates permission matrix against role-based access control rules
 * Ensures compliance with security policies and authorization matrix
 */
function validatePermissionMatrix(permissions: Array<{
  resourceType: ResourceType,
  accessLevel: AccessLevel
}>, role: UserRole): boolean {
  const rolePermissions = {
    [UserRole.EXECUTOR]: {
      [ResourceType.PERSONAL_INFO]: [AccessLevel.READ],
      [ResourceType.FINANCIAL_DATA]: [AccessLevel.READ],
      [ResourceType.MEDICAL_DATA]: [AccessLevel.NONE],
      [ResourceType.LEGAL_DOCS]: [AccessLevel.READ]
    },
    [UserRole.HEALTHCARE_PROXY]: {
      [ResourceType.PERSONAL_INFO]: [AccessLevel.READ],
      [ResourceType.FINANCIAL_DATA]: [AccessLevel.NONE],
      [ResourceType.MEDICAL_DATA]: [AccessLevel.READ],
      [ResourceType.LEGAL_DOCS]: [AccessLevel.READ]
    },
    [UserRole.FINANCIAL_ADVISOR]: {
      [ResourceType.PERSONAL_INFO]: [AccessLevel.NONE],
      [ResourceType.FINANCIAL_DATA]: [AccessLevel.READ],
      [ResourceType.MEDICAL_DATA]: [AccessLevel.NONE],
      [ResourceType.LEGAL_DOCS]: [AccessLevel.NONE]
    },
    [UserRole.LEGAL_ADVISOR]: {
      [ResourceType.PERSONAL_INFO]: [AccessLevel.READ],
      [ResourceType.FINANCIAL_DATA]: [AccessLevel.READ],
      [ResourceType.MEDICAL_DATA]: [AccessLevel.NONE],
      [ResourceType.LEGAL_DOCS]: [AccessLevel.READ]
    }
  } as const;

  if (!(role in rolePermissions)) {
    return false;
  }

  return permissions.every(permission => {
    const allowedLevels = rolePermissions[role as keyof typeof rolePermissions][permission.resourceType];
    return allowedLevels?.includes(permission.accessLevel) ?? false;
  });
}

/**
 * Schema for creating new delegates with comprehensive validation
 * Implements PIPEDA and HIPAA compliant validation rules
 */
export const createDelegateSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .refine(validateEmail, {
      message: 'Email validation failed or domain not allowed'
    }),
  role: z.nativeEnum(UserRole)
    .refine(role => role !== UserRole.OWNER, {
      message: 'Cannot create delegate with OWNER role'
    }),
  expiresAt: z.date()
    .min(new Date(), 'Expiration date must be in the future')
    .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'Expiration date cannot be more than 1 year in the future'),
  permissions: z.array(permissionSchema)
    .min(1, 'At least one permission must be specified')
    .superRefine((permissions, ctx) => {
      const data = ctx.path[0] as { role: UserRole };
      const role = data?.role;
      if (!validatePermissionMatrix(permissions, role)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid permission matrix for specified role'
        });
      }
    }),
  businessHours: businessHoursSchema
});

/**
 * Schema for updating existing delegates
 * Enforces strict validation for status transitions and permission changes
 */
export const updateDelegateSchema = z.object({
  role: z.nativeEnum(UserRole)
    .refine(role => role !== UserRole.OWNER, {
      message: 'Cannot update delegate to OWNER role'
    })
    .optional(),
  status: z.nativeEnum(DelegateStatus)
    .refine(
      status => ![DelegateStatus.EXPIRED, DelegateStatus.REVOKED].includes(status),
      {
        message: 'Cannot manually set delegate to EXPIRED or REVOKED status'
      }
    )
    .optional(),
  expiresAt: z.date()
    .min(new Date(), 'Expiration date must be in the future')
    .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'Expiration date cannot be more than 1 year in the future')
    .optional(),
  permissions: z.array(permissionSchema)
    .min(1, 'At least one permission must be specified')
    .superRefine((permissions, ctx) => {
      const data = ctx.path[0] as { role?: UserRole };
      const role = data?.role || UserRole.EXECUTOR;
      if (!validatePermissionMatrix(permissions, role)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid permission matrix for specified role'
        });
      }
    })
    .optional(),
  businessHours: businessHoursSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

/**
 * Schema for validating delegate IDs
 * Ensures proper UUID format for delegate identification
 */
export const delegateIdSchema = z.object({
  id: z.string().uuid('Invalid delegate ID format')
});