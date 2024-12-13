// External dependencies
import { z } from 'zod'; // Version: ^3.22.0

// Internal imports
import { UserRole, UserStatus } from '../../types/user.types';
import { validateEmail } from '../../utils/validation.util';

// Constants for validation rules
const ALLOWED_PROVINCES = ['ON', 'BC', 'AB', 'MB', 'NB', 'NL', 'NS', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'] as const;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const PHONE_REGEX = /^\+?1?[\s-]?\(?([0-9]{3})\)?[\s-]?[0-9]{3}[\s-]?[0-9]{4}$/;
const ALLOWED_TIMEZONES = [
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
  'America/St_Johns'
] as const;
const SUPPORTED_LANGUAGES = ['en-CA', 'fr-CA'] as const;

/**
 * Enhanced validator function for email format and security requirements
 * Implements PIPEDA compliance for Canadian email validation
 */
export const validateUserEmail = (email: string): boolean => {
  const validationResult = validateEmail(email);
  return validationResult.isValid;
};

/**
 * Base user profile schema with enhanced security and preference validations
 * Implements PIPEDA and HIPAA compliance requirements
 */
export const userProfileSchema = z.object({
  phoneNumber: z.string()
    .regex(PHONE_REGEX, 'Invalid Canadian phone number format')
    .nullable(),
  province: z.enum(ALLOWED_PROVINCES, {
    errorMap: () => ({ message: 'Must be a valid Canadian province/territory' })
  }),
  mfaEnabled: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  timezone: z.enum(ALLOWED_TIMEZONES, {
    errorMap: () => ({ message: 'Must be a valid Canadian timezone' })
  }).default('America/Toronto'),
  language: z.enum(SUPPORTED_LANGUAGES, {
    errorMap: () => ({ message: 'Must be a supported language (en-CA or fr-CA)' })
  }).default('en-CA')
});

/**
 * Schema for creating new users with enhanced validation
 * Ensures compliance with security requirements and data protection standards
 */
export const createUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .refine(validateUserEmail, {
      message: 'Email must be from a valid Canadian domain and meet security requirements'
    }),
  name: z.string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(MAX_NAME_LENGTH, `Name cannot exceed ${MAX_NAME_LENGTH} characters`)
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  province: z.enum(ALLOWED_PROVINCES, {
    errorMap: () => ({ message: 'Must be a valid Canadian province/territory' })
  })
}).strict();

/**
 * Schema for updating user information with partial updates support
 * Implements enhanced validation for profile updates and security features
 */
export const updateUserSchema = z.object({
  name: z.string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(MAX_NAME_LENGTH, `Name cannot exceed ${MAX_NAME_LENGTH} characters`)
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  profile: userProfileSchema.partial().optional(),
  status: z.enum([
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.PENDING,
    UserStatus.SUSPENDED
  ], {
    errorMap: () => ({ message: 'Invalid user status' })
  }).optional(),
  timezone: z.enum(ALLOWED_TIMEZONES, {
    errorMap: () => ({ message: 'Must be a valid Canadian timezone' })
  }).optional()
}).strict();

/**
 * Schema for delegate role assignment with enhanced security validation
 * Ensures proper access control and authorization
 */
export const delegateRoleSchema = z.object({
  role: z.enum([
    UserRole.EXECUTOR,
    UserRole.HEALTHCARE_PROXY,
    UserRole.FINANCIAL_ADVISOR,
    UserRole.LEGAL_ADVISOR
  ], {
    errorMap: () => ({ message: 'Invalid delegate role' })
  }),
  expiresAt: z.string()
    .datetime('Invalid expiration date format')
    .refine(date => new Date(date) > new Date(), {
      message: 'Expiration date must be in the future'
    })
}).strict();

/**
 * Schema for security preference updates with enhanced validation
 * Implements PIPEDA and HIPAA compliance requirements
 */
export const securityPreferencesSchema = z.object({
  mfaEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  auditEnabled: z.boolean().default(true)
}).strict();