/**
 * @fileoverview Mock data and factory functions for subscription-related testing
 * Provides comprehensive test coverage for subscription management and e-commerce integration
 * @version 1.0.0
 */

import { 
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  ISubscription,
  ISubscriptionCreateDTO
} from '../../src/types/subscription.types';

/**
 * Comprehensive mock subscription data with all required fields
 * Used as base data for subscription-related test cases
 */
export const mockSubscription: ISubscription = {
  id: 'uuid-mock-subscription-1',
  userId: 'uuid-mock-user-1',
  plan: SubscriptionPlan.PREMIUM,
  status: SubscriptionStatus.ACTIVE,
  billingCycle: BillingCycle.MONTHLY,
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: null,
  autoRenew: true,
  shopifySubscriptionId: 'mock-shopify-sub-1',
  shopifyCustomerId: 'mock-shopify-customer-1',
  shopifyOrderIds: ['mock-order-1', 'mock-order-2'],
  lastBillingDate: new Date('2024-01-01T00:00:00Z'),
  nextBillingDate: new Date('2024-02-01T00:00:00Z'),
  cancelReason: null,
  metadata: {
    trialDays: 30,
    promotionCode: 'WELCOME2024',
    features: ['digital-vault', 'delegate-access', 'physical-kit']
  }
};

/**
 * Mock subscription creation DTO with required and optional fields
 * Used for testing subscription creation flows
 */
export const mockSubscriptionCreateDTO: ISubscriptionCreateDTO = {
  userId: 'uuid-mock-user-1',
  plan: SubscriptionPlan.PREMIUM,
  billingCycle: BillingCycle.MONTHLY,
  autoRenew: true,
  shopifyCustomerId: 'mock-shopify-customer-1',
  trialDays: 30
};

/**
 * Factory function to create customized mock subscription data
 * Allows overriding specific fields while maintaining type safety
 * 
 * @param overrides - Partial subscription data to override default values
 * @returns Complete mock subscription object with merged overrides
 */
export const createMockSubscription = (overrides: Partial<ISubscription> = {}): ISubscription => {
  // Create a deep clone of the base mock to prevent mutation
  const baseMock: ISubscription = JSON.parse(JSON.stringify(mockSubscription));
  
  // Convert date strings back to Date objects
  baseMock.startDate = new Date(baseMock.startDate);
  baseMock.lastBillingDate = baseMock.lastBillingDate ? new Date(baseMock.lastBillingDate) : null;
  baseMock.nextBillingDate = baseMock.nextBillingDate ? new Date(baseMock.nextBillingDate) : null;
  
  // Merge overrides with type checking
  const mergedSubscription: ISubscription = {
    ...baseMock,
    ...overrides,
    // Ensure dates are properly handled when overridden
    startDate: overrides.startDate || baseMock.startDate,
    endDate: overrides.endDate || baseMock.endDate,
    lastBillingDate: overrides.lastBillingDate || baseMock.lastBillingDate,
    nextBillingDate: overrides.nextBillingDate || baseMock.nextBillingDate,
    // Merge metadata objects if provided
    metadata: {
      ...baseMock.metadata,
      ...(overrides.metadata || {})
    }
  };

  return mergedSubscription;
};

/**
 * Common test scenarios with pre-configured mock data
 * Provides ready-to-use mocks for specific test cases
 */
export const mockSubscriptionScenarios = {
  trial: createMockSubscription({
    status: SubscriptionStatus.TRIAL,
    endDate: new Date('2024-02-01T00:00:00Z'),
    metadata: { trialDays: 30, trialStartDate: new Date('2024-01-01T00:00:00Z') }
  }),
  
  cancelled: createMockSubscription({
    status: SubscriptionStatus.CANCELLED,
    endDate: new Date('2024-02-01T00:00:00Z'),
    autoRenew: false,
    cancelReason: 'Customer requested cancellation'
  }),
  
  expired: createMockSubscription({
    status: SubscriptionStatus.EXPIRED,
    endDate: new Date('2024-01-01T00:00:00Z'),
    autoRenew: false,
    nextBillingDate: null
  }),
  
  annual: createMockSubscription({
    billingCycle: BillingCycle.ANNUAL,
    nextBillingDate: new Date('2025-01-01T00:00:00Z'),
    metadata: { annualDiscount: 0.2 }
  })
};