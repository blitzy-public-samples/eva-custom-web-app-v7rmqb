/**
 * Estate Kit - Subscription Types
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides type definitions for subscription data structures such as subscription plans,
 *   statuses, and user associations.
 * 
 * Human Tasks:
 * 1. Verify that subscription status values align with backend API responses
 * 2. Ensure proper date handling for startDate and endDate fields in UI components
 * 3. Confirm that all subscription plan values are properly mapped in the UI
 */

import { AuthTypes } from './auth.types';
import { DelegateTypes } from './delegate.types';

/**
 * Interface defining the structure of subscription-related data.
 * Used for managing user subscriptions, plans, and subscription status.
 */
export interface SubscriptionTypes {
  /** The unique identifier for the subscription */
  subscriptionId: string;

  /** The unique identifier for the user associated with the subscription */
  userId: string;

  /** The subscription plan selected by the user */
  plan: string;

  /** The current status of the subscription */
  status: 'active' | 'inactive' | 'cancelled';

  /** The start date of the subscription */
  startDate: Date;

  /** The end date of the subscription */
  endDate: Date;
}

/**
 * Interface defining the structure of a document object.
 * Used for managing document metadata and properties within the subscription context.
 */
export interface DocumentTypes {
  /** The unique identifier for the document */
  documentId: string;

  /** The title of the document */
  title: string;

  /** The category of the document */
  category: string;

  /** The status of the document */
  status: string;

  /** Additional metadata associated with the document */
  metadata: Record<string, any>;

  /** The creation timestamp of the document */
  createdAt: Date;

  /** The last updated timestamp of the document */
  updatedAt: Date;
}

/**
 * Type guard to validate if an object conforms to the SubscriptionTypes interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid SubscriptionTypes
 */
export function isSubscriptionTypes(obj: any): obj is SubscriptionTypes {
  return (
    typeof obj === 'object' &&
    typeof obj.subscriptionId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.plan === 'string' &&
    ['active', 'inactive', 'cancelled'].includes(obj.status) &&
    obj.startDate instanceof Date &&
    obj.endDate instanceof Date
  );
}

/**
 * Type guard to validate if an object conforms to the DocumentTypes interface
 * @param obj - Object to validate
 * @returns boolean indicating if the object is a valid DocumentTypes
 */
export function isDocumentTypes(obj: any): obj is DocumentTypes {
  return (
    typeof obj === 'object' &&
    typeof obj.documentId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.metadata === 'object' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}