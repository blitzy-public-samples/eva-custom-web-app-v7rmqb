/**
 * @fileoverview Zod schema validators for subscription-related API endpoints
 * Implements robust validation for subscription operations with enhanced security
 * @version 1.0.0
 */

import { z } from 'zod'; // v3.22.0
import { 
  SubscriptionPlan, 
  BillingCycle, 
  SubscriptionStatus 
} from '../../types/subscription.types';

// UUID format validation regex with strict pattern matching
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Schema for validating subscription creation requests
 * Implements strict validation rules for all required fields
 */
export const createSubscriptionSchema = z.object({
  userId: z.string()
    .regex(UUID_REGEX, {
      message: 'Invalid user ID format. Must be a valid UUID v4'
    })
    .trim()
    .min(36, 'User ID must be exactly 36 characters')
    .max(36, 'User ID must be exactly 36 characters'),

  plan: z.enum([
    SubscriptionPlan.FREE,
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PREMIUM
  ], {
    errorMap: (issue) => ({
      message: 'Invalid subscription plan. Must be one of: FREE, BASIC, or PREMIUM'
    })
  }),

  billingCycle: z.enum([
    BillingCycle.MONTHLY,
    BillingCycle.ANNUAL
  ], {
    errorMap: (issue) => ({
      message: 'Invalid billing cycle. Must be either MONTHLY or ANNUAL'
    })
  }),

  autoRenew: z.boolean({
    required_error: 'Auto-renew preference is required',
    invalid_type_error: 'Auto-renew must be a boolean value'
  })
}).strict(); // Prevents additional properties for security

/**
 * Schema for validating subscription updates
 * Supports partial updates with transition validation
 */
export const updateSubscriptionSchema = z.object({
  plan: z.enum([
    SubscriptionPlan.FREE,
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PREMIUM
  ], {
    errorMap: (issue) => ({
      message: 'Invalid subscription plan. Must be one of: FREE, BASIC, or PREMIUM'
    })
  }).optional(),

  billingCycle: z.enum([
    BillingCycle.MONTHLY,
    BillingCycle.ANNUAL
  ], {
    errorMap: (issue) => ({
      message: 'Invalid billing cycle. Must be either MONTHLY or ANNUAL'
    })
  }).optional(),

  autoRenew: z.boolean({
    invalid_type_error: 'Auto-renew must be a boolean value'
  }).optional(),

  status: z.enum([
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.EXPIRED,
    SubscriptionStatus.PENDING
  ], {
    errorMap: (issue) => ({
      message: 'Invalid subscription status. Must be one of: ACTIVE, CANCELLED, EXPIRED, or PENDING'
    })
  })
    .optional()
    .refine(
      (status) => {
        // Prevent direct transition to EXPIRED status
        if (status === SubscriptionStatus.EXPIRED) {
          return false;
        }
        return true;
      },
      {
        message: 'Cannot directly set subscription status to EXPIRED'
      }
    )
}).strict();

/**
 * Schema for validating subscription ID in request parameters
 * Implements strict UUID format validation
 */
export const subscriptionIdSchema = z.object({
  subscriptionId: z.string()
    .regex(UUID_REGEX, {
      message: 'Invalid subscription ID format. Must be a valid UUID v4'
    })
    .trim()
    .min(36, 'Subscription ID must be exactly 36 characters')
    .max(36, 'Subscription ID must be exactly 36 characters')
    .refine(
      (id) => !id.includes('<') && !id.includes('>'), // Prevent XSS attempts
      {
        message: 'Subscription ID contains invalid characters'
      }
    )
}).strict();