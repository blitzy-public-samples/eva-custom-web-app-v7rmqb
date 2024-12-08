/**
 * Estate Kit - Authentication Middleware
 * Version: 1.0.0
 * 
 * This middleware implements authentication for the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements account creation and authentication using Auth0.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces role-based access control (RBAC) using Auth0 roles and permissions.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of sensitive data such as tokens and user credentials.
 * 
 * Human Tasks:
 * 1. Configure Auth0 tenant and application settings
 * 2. Set up environment variables for Auth0 credentials
 * 3. Configure JWT token expiration and refresh token settings
 * 4. Review and update authentication policies periodically
 */

// @package jsonwebtoken v9.0.0
import { Request, Response, NextFunction } from 'express';
import { validateToken } from '../config/auth0';
import { logError } from '../utils/logger.util';
import { rbacMiddleware } from './rbac.middleware';
import { validateUser } from '../utils/validation.util';

/**
 * Middleware function to authenticate API requests by validating JWT tokens.
 * Implements requirements: Authentication, Role-Based Access Control, Data Security
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    // Verify Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Invalid authorization format' });
      return;
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    try {
      // Validate the JWT token using Auth0
      const decodedToken = await validateToken(token);

      // Extract user information from the decoded token
      const user = {
        userId: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        role: decodedToken.role,
        permissions: decodedToken.permissions
      };

      // Validate the user object structure
      if (!validateUser(user)) {
        logError(new Error('Invalid user object structure'));
        res.status(401).json({ error: 'Invalid user data' });
        return;
      }

      // Attach the validated user object to the request
      req.user = user;

      // Apply RBAC middleware with the validated user's role
      await rbacMiddleware({
        requiredRole: user.role,
        requiredPermissions: user.permissions
      })(req, res, next);

    } catch (tokenError) {
      logError(tokenError as Error);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

  } catch (error) {
    // Log any unexpected errors
    logError(error as Error);
    res.status(500).json({ error: 'Authentication failed' });
    return;
  }
};