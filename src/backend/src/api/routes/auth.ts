/**
 * Estate Kit - Authentication Routes
 * Version: 1.0.0
 * 
 * This file defines the routing logic for authentication-related API endpoints
 * in the Estate Kit backend system.
 * 
 * Human Tasks:
 * 1. Configure Auth0 tenant and application settings
 * 2. Set up environment variables for Auth0 credentials
 * 3. Configure JWT token expiration and refresh token settings
 * 4. Review and update authentication policies periodically
 */

// @package express v4.18.2
import { Router } from 'express';

// Import controllers
import { login, validateToken } from '../controllers/auth.controller';

// Import validators and middleware
import { validateAuthRequest } from '../validators/auth.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequestMiddleware } from '../middlewares/validation.middleware';

/**
 * Router instance for authentication endpoints
 * 
 * Requirements Addressed:
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements account creation and authentication using Auth0.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces role-based access control (RBAC) using Auth0 roles and permissions.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements validation mechanisms to ensure data integrity and prevent invalid inputs.
 */
const router = Router();

/**
 * POST /auth/login
 * 
 * Handles user login requests by validating credentials and returning an authentication token.
 * 
 * Requirements Addressed:
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements secure user authentication using Auth0.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Validates login credentials before processing.
 */
router.post(
  '/login',
  validateAuthRequest,
  validateRequestMiddleware,
  login
);

/**
 * POST /auth/validate-token
 * 
 * Validates a JWT token and retrieves user roles and permissions.
 * 
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Validates user tokens and enforces role-based access control.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of authentication tokens.
 */
router.post(
  '/validate-token',
  authMiddleware,
  validateRequestMiddleware,
  validateToken
);

export default router;