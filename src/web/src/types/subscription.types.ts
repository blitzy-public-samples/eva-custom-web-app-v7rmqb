/**
 * @fileoverview TypeScript type definitions for subscription-related data structures
 * Includes interfaces and enums for subscription management with Shopify integration
 * @version 1.0.0
 */

/**
 * Available subscription plan types
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

/**
 * Possible subscription statuses
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

/**
 * Subscription billing cycle options
 */
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL'
}

/**
 * Interface defining subscription plan features
 */
export interface ISubscriptionFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

/**
 * Interface for subscription plan details with Shopify integration
 */
export interface ISubscriptionPlanDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  features: ISubscriptionFeature[];
  shopifyProductId: string;
}

/**
 * Interface for user subscription data with Shopify integration details
 */
export interface ISubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  billingCycle: BillingCycle;
  shopifySubscriptionId: string;
  shopifyCustomerId: string;
  lastBillingDate: Date | null;
  nextBillingDate: Date | null;
}

/**
 * Interface for API responses containing subscription and plan details
 */
export interface ISubscriptionResponse {
  subscription: ISubscription;
  planDetails: ISubscriptionPlanDetails;
}

/**
 * Data transfer object for creating new subscriptions
 */
export interface ISubscriptionCreateDTO {
  userId: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  autoRenew: boolean;
}

/**
 * Data transfer object for updating existing subscriptions
 */
export interface ISubscriptionUpdateDTO {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  status: SubscriptionStatus;
}