// @package zod v3.21.4
import { z } from 'zod';
import { SubscriptionSchema } from '../types/subscription.types';
import { validateUserSubscription } from '../utils/validation.util';

/**
 * Human Tasks:
 * 1. Ensure that error messages in validation are properly localized
 * 2. Verify that validation error handling aligns with the API error response format
 * 3. Confirm that subscription data validation rules match the payment gateway requirements
 */

/**
 * Requirement: Subscription Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/Subscription Management
 * Description: Implements validation mechanisms to ensure subscription data integrity 
 * and compliance with the defined schemas.
 */

/**
 * Validates subscription data against the SubscriptionSchema
 * @param subscriptionData - The subscription data to validate
 * @returns boolean indicating if the subscription data is valid
 * @throws ZodError if validation fails with detailed error information
 */
export function validateSubscriptionData(subscriptionData: any): boolean {
    try {
        // Validate subscription plan data if present
        if ('plan' in subscriptionData) {
            SubscriptionSchema.plan.parse(subscriptionData.plan);
        }

        // Validate user subscription data if present
        if ('userSubscription' in subscriptionData) {
            SubscriptionSchema.userSubscription.parse(subscriptionData.userSubscription);

            // Additional validation using utility function
            if (!validateUserSubscription(subscriptionData.userSubscription)) {
                throw new Error('Invalid user subscription data structure');
            }
        }

        // If neither plan nor userSubscription is present, throw error
        if (!('plan' in subscriptionData) && !('userSubscription' in subscriptionData)) {
            throw new Error('Subscription data must contain either plan or userSubscription');
        }

        // Additional validation rules
        if ('plan' in subscriptionData && 'price' in subscriptionData.plan) {
            if (subscriptionData.plan.price <= 0) {
                throw new Error('Subscription plan price must be greater than 0');
            }
        }

        if ('userSubscription' in subscriptionData) {
            const { startDate, endDate } = subscriptionData.userSubscription;
            if (new Date(startDate) > new Date(endDate)) {
                throw new Error('Subscription start date must be before end date');
            }
        }

        return true;
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Rethrow Zod validation errors with detailed information
            throw error;
        }
        // Rethrow other validation errors
        throw new Error(`Subscription validation failed: ${error.message}`);
    }
}