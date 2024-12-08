/**
 * Requirement: Subscription Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/Subscription Management
 * Description: Provides mock data and utilities for testing subscription-related functionalities
 * 
 * Human Tasks:
 * 1. Verify that the mock subscription plan IDs match the actual plan IDs in the production environment
 * 2. Ensure the mock dates are appropriate for the testing context and timezone considerations
 * 3. Validate that the mock feature lists align with current product offerings
 */

import { SubscriptionPlan, UserSubscription } from '../types/subscription.types';

// Mock subscription plans data for testing purposes
const mockSubscriptionPlans: SubscriptionPlan[] = [
    {
        id: 'plan_basic',
        name: 'Basic Plan',
        price: 10,
        features: ['Feature A', 'Feature B']
    },
    {
        id: 'plan_premium',
        name: 'Premium Plan',
        price: 20,
        features: ['Feature A', 'Feature B', 'Feature C']
    }
];

// Mock user subscriptions data for testing purposes
const mockUserSubscriptions: UserSubscription[] = [
    {
        userId: 'user_1',
        planId: 'plan_basic',
        status: 'active',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2024-01-01')
    },
    {
        userId: 'user_2',
        planId: 'plan_premium',
        status: 'inactive',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-01-01')
    }
];

/**
 * Retrieves mock subscription plans for testing purposes
 * Requirement: Subscription Management
 * @returns {SubscriptionPlan[]} An array of mock subscription plans
 */
export const getMockSubscriptionPlans = (): SubscriptionPlan[] => {
    return mockSubscriptionPlans;
};

/**
 * Retrieves mock user subscriptions for testing purposes
 * Requirement: Subscription Management
 * @returns {UserSubscription[]} An array of mock user subscriptions
 */
export const getMockUserSubscriptions = (): UserSubscription[] => {
    return mockUserSubscriptions;
};