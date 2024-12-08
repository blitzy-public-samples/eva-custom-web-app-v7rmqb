// @package zod v3.21.4
import { z } from 'zod';
import { SubscriptionModel } from '../db/models/subscription.model';
import { SubscriptionPlan } from '../types/subscription.types';
import { validateUserSubscription } from '../utils/validation.util';
import { logInfo, logError } from '../utils/logger.util';
import { initializeAuth0 } from '../config/auth0';
import { initializeS3 } from '../config/aws';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured for subscription model
 * 2. Verify that Auth0 roles are set up for subscription access control
 * 3. Configure S3 bucket permissions for subscription document storage
 * 4. Set up monitoring alerts for subscription status changes
 */

/**
 * Creates a new subscription for a user
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements subscription creation with validation and logging
 * 
 * @param subscriptionData - The subscription data to create
 * @returns Promise resolving to the created subscription
 * @throws Error if validation fails or creation is unsuccessful
 */
export const createSubscription = async (subscriptionData: any): Promise<SubscriptionModel> => {
  try {
    // Validate subscription data
    if (!validateUserSubscription(subscriptionData)) {
      throw new Error('Invalid subscription data');
    }

    // Initialize required services
    await initializeAuth0();
    await initializeS3();

    // Log the subscription creation attempt
    logInfo(`Creating subscription for user: ${subscriptionData.userId}`);

    // Create the subscription record
    const subscription = await SubscriptionModel.create({
      userId: subscriptionData.userId,
      planId: subscriptionData.planId,
      status: 'inactive', // Default status
      startDate: subscriptionData.startDate,
      endDate: subscriptionData.endDate
    });

    // Log successful creation
    logInfo(`Subscription created successfully: ${subscription.subscriptionId}`);

    return subscription;
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to create subscription');
  }
};

/**
 * Updates the status of an existing subscription
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements subscription status updates with validation
 * 
 * @param subscriptionId - The ID of the subscription to update
 * @param status - The new status to set
 * @returns Promise resolving to true if successful, false otherwise
 */
export const updateSubscription = async (
  subscriptionId: string,
  status: 'active' | 'inactive' | 'cancelled'
): Promise<boolean> => {
  try {
    // Log the update attempt
    logInfo(`Updating subscription status: ${subscriptionId} to ${status}`);

    // Update the subscription status
    const success = await SubscriptionModel.updateSubscriptionStatus(
      subscriptionId,
      status
    );

    if (success) {
      logInfo(`Subscription status updated successfully: ${subscriptionId}`);
    } else {
      logError(new Error(`Failed to update subscription status: ${subscriptionId}`));
    }

    return success;
  } catch (error) {
    logError(error as Error);
    return false;
  }
};

/**
 * Retrieves all subscriptions associated with a specific user
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements subscription retrieval functionality
 * 
 * @param userId - The ID of the user to get subscriptions for
 * @returns Promise resolving to an array of subscriptions
 */
export const getUserSubscriptions = async (userId: string): Promise<SubscriptionModel[]> => {
  try {
    // Log the retrieval attempt
    logInfo(`Retrieving subscriptions for user: ${userId}`);

    // Find all subscriptions for the user
    const subscriptions = await SubscriptionModel.findByUserId(userId);

    // Log the result
    logInfo(`Retrieved ${subscriptions.length} subscriptions for user: ${userId}`);

    return subscriptions;
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to retrieve user subscriptions');
  }
};