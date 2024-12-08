/**
 * Estate Kit - Authentication Controller
 * Version: 1.0.0
 * 
 * This controller implements authentication endpoints for the Estate Kit backend system.
 * 
 * Human Tasks:
 * 1. Configure Auth0 tenant and application settings
 * 2. Set up environment variables for Auth0 credentials
 * 3. Configure JWT token expiration and refresh token settings
 * 4. Review and update authentication policies periodically
 */

import { Request, Response } from 'express';
import { validateAuthRequest } from '../validators/auth.validator';
import { authenticateUser, validateUserToken } from '../../services/auth.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { handleError } from '../../utils/error.util';
import { logError } from '../../utils/logger.util';

/**
 * Handles user login by validating credentials and returning an authentication token
 * 
 * Requirements Addressed:
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements account creation and authentication using Auth0.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of sensitive data such as tokens and user credentials.
 * 
 * @param req - Express request object containing login credentials
 * @param res - Express response object
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate request structure and credentials
    if (!validateAuthRequest({ username, password })) {
      res.status(400).json({ error: 'Invalid request format' });
      return;
    }

    // Authenticate user and get token
    const authResult = await authenticateUser(username, password);

    // Return authentication token and user profile
    res.status(200).json({
      success: true,
      data: {
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        profile: authResult.profile
      }
    });

  } catch (error) {
    logError(error as Error);
    handleError(error as Error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Validates a JWT token and retrieves user roles
 * 
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces role-based access control (RBAC) using Auth0 roles and permissions.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of sensitive data such as tokens.
 * 
 * @param req - Express request object containing the token
 * @param res - Express response object
 */
export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Validate token and get user roles
    const validationResult = await validateUserToken(token);

    // Return user roles and token payload
    res.status(200).json({
      success: true,
      data: {
        roles: validationResult.roles,
        permissions: validationResult.permissions,
        payload: validationResult.payload
      }
    });

  } catch (error) {
    logError(error as Error);
    handleError(error as Error);
    res.status(401).json({ error: 'Token validation failed' });
  }
};