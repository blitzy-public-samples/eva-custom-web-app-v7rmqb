/**
 * Estate Kit - Subscription Routes
 * 
 * Requirements Addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
 *   Implements API routes for managing subscription plans, user subscriptions, and related operations.
 * 
 * Human Tasks:
 * 1. Configure rate limiting for subscription endpoints
 * 2. Set up monitoring for subscription-related API calls
 * 3. Review and update subscription validation rules periodically
 * 4. Ensure proper error handling and logging is configured
 */

// @package express v4.18.2
import { Router } from 'express';

// Import controllers
import {
  createSubscriptionHandler,
  updateSubscriptionHandler,
  getUserSubscriptionsHandler
} from '../controllers/subscriptions.controller';

// Import middleware
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequestMiddleware } from '../middlewares/validation.middleware';

// Import validators
import { validateSubscriptionData } from '../validators/subscriptions.validator';

/**
 * Defines the API routes for subscription management.
 * Implements requirement: Subscription Management
 * 
 * @param router - Express Router instance
 * @returns Configured router with subscription routes
 */
const defineRoutes = (router: Router): Router => {
  // Create a new subscription
  // POST /api/subscriptions
  router.post(
    '/',
    authMiddleware,
    validateRequestMiddleware,
    createSubscriptionHandler
  );

  // Update an existing subscription
  // PUT /api/subscriptions/:subscriptionId
  router.put(
    '/:subscriptionId',
    authMiddleware,
    validateRequestMiddleware,
    updateSubscriptionHandler
  );

  // Get user subscriptions
  // GET /api/subscriptions/user/:userId
  router.get(
    '/user/:userId',
    authMiddleware,
    getUserSubscriptionsHandler
  );

  return router;
};

// Export the route configuration function
export default defineRoutes;