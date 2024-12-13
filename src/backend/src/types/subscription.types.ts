/**
 * @fileoverview TypeScript type definitions for subscription-related data structures
 * Defines interfaces and enums for Estate Kit's subscription management system with Shopify integration
 * @version 1.0.0
 */

/**
 * Available subscription plan types with tiered access levels
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

/**
 * Comprehensive subscription status states including trial and payment states
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  TRIAL = 'TRIAL',
  PAST_DUE = 'PAST_DUE'
}

/**
 * Subscription billing cycle options
 */
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL'
}

/**
 * Interface defining subscription plan feature structure
 * Includes usage limits and feature categorization
 */
export interface ISubscriptionFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit: number | null;
  category: string;
}

/**
 * Comprehensive interface defining subscription plan details
 * Includes Shopify integration and trial support
 */
export interface ISubscriptionPlanDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  features: ISubscriptionFeature[];
  shopifyProductId: string;
  shopifyPriceId: string;
  trialDays: number;
  compareAtPrice: number | null;
}

/**
 * Comprehensive interface defining user subscription data
 * Includes complete Shopify integration and tracking details
 */
export interface ISubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  shopifySubscriptionId: string;
  shopifyCustomerId: string;
  shopifyOrderIds: string[];
  lastBillingDate: Date | null;
  nextBillingDate: Date | null;
  cancelReason: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Data transfer object for creating new subscriptions
 * Includes trial period support
 */
export interface ISubscriptionCreateDTO {
  userId: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  shopifyCustomerId: string;
  trialDays: number | null;
}

/**
 * Data transfer object for updating existing subscriptions
 * Includes cancellation tracking
 */
export interface ISubscriptionUpdateDTO {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  status: SubscriptionStatus;
  cancelReason: string | null;
}

/**
 * Enhanced interface for API responses
 * Contains subscription, plan details, and usage metrics
 */
export interface ISubscriptionResponse {
  subscription: ISubscription;
  planDetails: ISubscriptionPlanDetails;
  usage: Record<string, number>;
}