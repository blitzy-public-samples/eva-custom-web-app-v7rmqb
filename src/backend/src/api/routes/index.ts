/**
 * Estate Kit - API Routes Entry Point
 * Version: 1.0.0
 * 
 * This file serves as the central entry point for all API routes in the Estate Kit backend system.
 * It consolidates and organizes routes for users, subscriptions, documents, delegates, and authentication.
 * 
 * Human Tasks:
 * 1. Configure rate limiting for API endpoints
 * 2. Set up monitoring for API request patterns
 * 3. Review and update API versioning strategy
 * 4. Configure API documentation generation
 */

// @package express v4.18.2
import { Router } from 'express';

// Import route modules
import userRoutes from './users';
import subscriptionRoutes from './subscriptions';
import documentRoutes from './documents';
import delegateRoutes from './delegates';
import authRoutes from './auth';

/**
 * Initializes and consolidates all API routes into a single router instance.
 * 
 * Requirements Addressed:
 * - API Gateway (Technical Specifications/2.2 Container Architecture/API Gateway)
 *   Provides a centralized routing mechanism for all API endpoints.
 * - Modular Architecture (Technical Specifications/2.6 Technical Decisions/Architecture Style)
 *   Ensures modularity by separating route definitions into individual files.
 * 
 * @param router - Express Router instance to configure
 * @returns The configured Router instance containing all API routes
 */
export const initializeRoutes = (router: Router): Router => {
  // Mount user-related routes
  router.use('/users', userRoutes);

  // Mount subscription-related routes
  router.use('/subscriptions', subscriptionRoutes);

  // Mount document-related routes
  router.use('/documents', documentRoutes);

  // Mount delegate-related routes
  router.use('/delegates', delegateRoutes);

  // Mount authentication-related routes
  router.use('/auth', authRoutes);

  return router;
};

// Create and configure the main router instance
const mainRouter = Router();
const configuredRouter = initializeRoutes(mainRouter);

// Export the configured router
export default configuredRouter;