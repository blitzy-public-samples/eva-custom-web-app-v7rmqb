/**
 * Human Tasks:
 * 1. Configure rate limiting for user-related API endpoints
 * 2. Set up monitoring for authentication failures and suspicious activities
 * 3. Review and update RBAC policies for user management endpoints
 * 4. Ensure Auth0 configuration is properly set up in the environment
 */

// @package express v4.18.2
import { Router } from 'express';
import {
  createUserController,
  getUserByEmailController,
  updateUserProfileController
} from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequestMiddleware } from '../middlewares/validation.middleware';
import { validateUserRequest } from '../validators/users.validator';

/**
 * Router instance for user-related API endpoints
 * 
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements API endpoints for managing user accounts and profiles.
 */
const userRoutes = Router();

/**
 * POST /api/users
 * Creates a new user account
 * 
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements API endpoint for creating new user accounts.
 * 
 * Requirement: Data Validation
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Ensures that user creation requests are validated.
 */
userRoutes.post(
  '/',
  validateRequestMiddleware,
  async (req, res) => {
    // Validate request body before proceeding
    if (!validateUserRequest(req.body)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'The request payload failed validation'
      });
    }
    await createUserController(req, res);
  }
);

/**
 * GET /api/users/email/:email
 * Retrieves a user by their email address
 * 
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements API endpoint for retrieving user information.
 * 
 * Requirement: Role-Based Access Control
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Enforces authentication and authorization for user data access.
 */
userRoutes.get(
  '/email/:email',
  authMiddleware,
  async (req, res) => {
    // Email format validation is handled by the controller
    await getUserByEmailController(req, res);
  }
);

/**
 * PUT /api/users/:userId/profile
 * Updates a user's profile information
 * 
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements API endpoint for updating user profiles.
 * 
 * Requirement: Role-Based Access Control
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Enforces authentication and authorization for profile updates.
 * 
 * Requirement: Data Validation
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Ensures that profile updates are validated.
 */
userRoutes.put(
  '/:userId/profile',
  authMiddleware,
  validateRequestMiddleware,
  async (req, res) => {
    // Validate request body before proceeding
    if (!validateUserRequest(req.body)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'The request payload failed validation'
      });
    }
    await updateUserProfileController(req, res);
  }
);

// Export the router with all user-related routes
export default userRoutes;