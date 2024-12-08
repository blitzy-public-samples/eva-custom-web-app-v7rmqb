/**
 * Estate Kit - Auth0 Integration
 * Version: 1.0.0
 * 
 * This file integrates Auth0 authentication and authorization services into the Estate Kit backend system.
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
 * 3. Configure role mappings between Auth0 and application roles
 * 4. Set up error monitoring and alerting for authentication failures
 */

// @package auth0 v2.37.0
import { initializeAuth0, validateToken, getUserRoles } from '../config/auth0';
import { logError } from '../utils/logger.util';
import { handleError } from '../utils/error.util';
import { getUserByEmail } from '../services/user.service';
import { UserTypes } from '../types/user.types';

/**
 * Authenticates a user using their JWT token.
 * Implements requirement: Authentication - Secure token validation
 * 
 * @param token - The JWT token to validate
 * @returns Promise resolving to the decoded token payload
 * @throws Error if token validation fails
 */
export const authenticateUser = async (token: string): Promise<object> => {
  try {
    // Log authentication attempt
    logError(new Error(`Authentication attempt with token: ${token.substring(0, 10)}...`));

    // Initialize Auth0 if not already initialized
    await initializeAuth0();

    // Validate the token
    const decodedToken = await validateToken(token);

    if (!decodedToken) {
      throw new Error('Token validation failed');
    }

    return decodedToken;
  } catch (error) {
    handleError(error as Error);
    throw new Error('Authentication failed');
  }
};

/**
 * Fetches the roles assigned to a user from Auth0.
 * Implements requirement: Role-Based Access Control - Role management
 * 
 * @param userId - The Auth0 user ID
 * @returns Promise resolving to an array of roles
 * @throws Error if role fetching fails
 */
export const fetchUserRoles = async (userId: string): Promise<string[]> => {
  try {
    // Log role fetching operation
    logError(new Error(`Fetching roles for user: ${userId}`));

    // Initialize Auth0 if not already initialized
    await initializeAuth0();

    // Fetch roles from Auth0
    const roles = await getUserRoles(userId);

    if (!roles || !Array.isArray(roles)) {
      throw new Error('Invalid roles response from Auth0');
    }

    return roles.map(role => role.name);
  } catch (error) {
    handleError(error as Error);
    throw new Error('Failed to fetch user roles');
  }
};

/**
 * Retrieves user details by their email address.
 * Implements requirement: Authentication - User profile management
 * 
 * @param email - The email address to search for
 * @returns Promise resolving to the user object if found, null otherwise
 * @throws Error if user retrieval fails
 */
export const getUserDetails = async (email: string): Promise<UserTypes | null> => {
  try {
    // Log user details retrieval operation
    logError(new Error(`Retrieving user details for email: ${email}`));

    // Initialize Auth0 if not already initialized
    await initializeAuth0();

    // Get user details from the user service
    const user = await getUserByEmail(email);

    if (!user) {
      logError(new Error(`User not found for email: ${email}`));
      return null;
    }

    return user;
  } catch (error) {
    handleError(error as Error);
    throw new Error('Failed to retrieve user details');
  }
};