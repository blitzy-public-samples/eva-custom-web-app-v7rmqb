/**
 * Estate Kit - Frontend Validation Utilities
 * 
 * Requirements addressed:
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements validation mechanisms to ensure data integrity and prevent invalid or malicious inputs.
 * 
 * Human Tasks:
 * 1. Review validation rules with backend team to ensure alignment
 * 2. Verify email validation regex matches security requirements
 * 3. Confirm password complexity requirements are up to date
 */

// zod v3.21.4
import { z } from 'zod';
import { AuthTypes } from '../types/auth.types';
import { SubscriptionTypes } from '../types/subscription.types';
import { DocumentTypes } from '../types/document.types';
import { DelegateTypes } from '../types/delegate.types';

// Zod schemas for validation
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin', 'delegate'])
});

const subscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  status: z.enum(['active', 'inactive', 'cancelled'])
});

const documentSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().min(1),
  category: z.string().min(1)
});

const delegatePermissionSchema = z.object({
  permissionId: z.string().uuid(),
  resourceType: z.string().min(1),
  accessLevel: z.string().min(1)
});

const delegateSchema = z.object({
  delegateId: z.string().uuid(),
  permissions: z.array(delegatePermissionSchema)
});

/**
 * Validates an authentication object against the AuthTypes interface
 * @param auth - Authentication object to validate
 * @returns True if the authentication object is valid, otherwise false
 */
export function validateAuth(auth: AuthTypes): boolean {
  try {
    authSchema.parse(auth);
    return true;
  } catch (error) {
    console.error('Auth validation failed:', error);
    return false;
  }
}

/**
 * Validates a subscription object against the SubscriptionTypes interface
 * @param subscription - Subscription object to validate
 * @returns True if the subscription object is valid, otherwise false
 */
export function validateSubscription(subscription: SubscriptionTypes): boolean {
  try {
    subscriptionSchema.parse(subscription);
    return true;
  } catch (error) {
    console.error('Subscription validation failed:', error);
    return false;
  }
}

/**
 * Validates a document object against the DocumentTypes interface
 * @param document - Document object to validate
 * @returns True if the document object is valid, otherwise false
 */
export function validateDocument(document: DocumentTypes): boolean {
  try {
    documentSchema.parse(document);
    return true;
  } catch (error) {
    console.error('Document validation failed:', error);
    return false;
  }
}

/**
 * Validates a delegate object against the DelegateTypes interface
 * @param delegate - Delegate object to validate
 * @returns True if the delegate object is valid, otherwise false
 */
export function validateDelegate(delegate: DelegateTypes): boolean {
  try {
    delegateSchema.parse(delegate);
    return true;
  } catch (error) {
    console.error('Delegate validation failed:', error);
    return false;
  }
}