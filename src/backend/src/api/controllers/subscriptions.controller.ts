// @package express v4.18.2
import { Request, Response } from 'express';

// Import service functions
import { 
  createSubscription,
  updateSubscription,
  getUserSubscriptions 
} from '../../services/subscription.service';

// Import validation and utility functions
import { validateSubscriptionData } from '../../validators/subscriptions.validator';
import { handleError } from '../../utils/error.util';
import { logInfo } from '../../utils/logger.util';

// Import types
import { UserSubscription } from '../../types/subscription.types';

/**
 * Human Tasks:
 * 1. Ensure proper error monitoring is configured for subscription-related errors
 * 2. Verify that subscription status transitions are properly logged for auditing
 * 3. Configure rate limiting for subscription endpoints if needed
 * 4. Review subscription validation rules with business stakeholders
 */

/**
 * Handles HTTP POST requests to create a new subscription.
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements subscription creation with validation and error handling
 */
export const createSubscriptionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log the incoming request
    logInfo(`Creating subscription for user: ${req.body.userId}`);

    // Validate the subscription data
    const isValid = validateSubscriptionData(req.body);
    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
      return;
    }

    // Create the subscription
    const subscription = await createSubscription(req.body);

    // Log successful creation
    logInfo(`Subscription created successfully: ${subscription.subscriptionId}`);

    // Send success response
    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    handleError(error as Error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: (error as Error).message
    });
  }
};

/**
 * Handles HTTP PUT requests to update an existing subscription.
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements subscription status updates with validation
 */
export const updateSubscriptionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const { status } = req.body;

    // Log the update attempt
    logInfo(`Updating subscription ${subscriptionId} status to ${status}`);

    // Validate the subscription status
    const isValid = validateSubscriptionData({
      userSubscription: {
        status
      }
    });

    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription status'
      });
      return;
    }

    // Update the subscription
    const success = await updateSubscription(subscriptionId, status);

    if (success) {
      // Log successful update
      logInfo(`Subscription ${subscriptionId} updated successfully`);

      res.status(200).json({
        success: true,
        message: 'Subscription updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
  } catch (error) {
    handleError(error as Error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: (error as Error).message
    });
  }
};

/**
 * Handles HTTP GET requests to retrieve subscriptions for a specific user.
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements subscription retrieval functionality
 */
export const getUserSubscriptionsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Log the retrieval attempt
    logInfo(`Retrieving subscriptions for user: ${userId}`);

    // Get user subscriptions
    const subscriptions = await getUserSubscriptions(userId);

    // Log successful retrieval
    logInfo(`Retrieved ${subscriptions.length} subscriptions for user: ${userId}`);

    // Send success response
    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    handleError(error as Error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user subscriptions',
      error: (error as Error).message
    });
  }
};