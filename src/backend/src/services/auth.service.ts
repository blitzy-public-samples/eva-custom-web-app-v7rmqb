/**
 * Estate Kit - Authentication Service
 * Version: 1.0.0
 * 
 * This service implements authentication and authorization functionality using Auth0.
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
 * 3. Configure role mappings in Auth0 dashboard
 * 4. Set up email templates for authentication notifications
 */

// @package auth0 v2.37.0
import { initializeAuth0, validateToken } from '../config/auth0';
import { encryptData } from '../utils/encryption.util';
import { logError } from '../utils/logger.util';
import { UserModel } from '../db/models/user.model';
import { validateAuthRequest } from '../api/validators/auth.validator';

/**
 * Authenticates a user using their email and password
 * Implements requirement: Authentication - User authentication via Auth0
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Object containing authentication token and user profile
 * @throws Error if authentication fails
 */
export const authenticateUser = async (email: string, password: string) => {
  try {
    // Validate authentication request
    if (!validateAuthRequest({ username: email, password })) {
      throw new Error('Invalid authentication request');
    }

    // Initialize Auth0 client
    const { authClient } = initializeAuth0();

    // Authenticate with Auth0
    const authResult = await authClient.passwordGrant({
      username: email,
      password,
      scope: 'openid profile email'
    });

    // Retrieve user profile from database
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found in database');
    }

    // Encrypt sensitive data before returning
    const encryptedToken = encryptData(authResult.access_token, process.env.ENCRYPTION_KEY as string);
    const encryptedRefreshToken = encryptData(authResult.refresh_token, process.env.ENCRYPTION_KEY as string);

    return {
      token: encryptedToken,
      refreshToken: encryptedRefreshToken,
      profile: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      }
    };
  } catch (error) {
    logError(error as Error);
    throw new Error('Authentication failed');
  }
};

/**
 * Validates a user's JWT token and retrieves their roles
 * Implements requirement: Role-Based Access Control - Token validation and role verification
 * 
 * @param token - JWT token to validate
 * @returns Object containing user roles and token payload
 * @throws Error if token validation fails
 */
export const validateUserToken = async (token: string) => {
  try {
    // Validate token using Auth0 configuration
    const decodedToken = await validateToken(token);

    // Extract user ID from token payload
    const userId = decodedToken.sub;
    if (!userId) {
      throw new Error('Invalid token payload');
    }

    // Retrieve user from database to get roles
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      roles: user.role,
      permissions: user.permissions,
      payload: decodedToken
    };
  } catch (error) {
    logError(error as Error);
    throw new Error('Token validation failed');
  }
};

/**
 * Updates a user's profile information in the database
 * Implements requirement: User Management - Profile updates with security controls
 * 
 * @param userId - ID of the user to update
 * @param profileData - Object containing profile data to update
 * @returns boolean indicating if update was successful
 */
export const updateUserProfile = async (userId: string, profileData: any): Promise<boolean> => {
  try {
    // Validate profile data
    if (!validateAuthRequest(profileData)) {
      throw new Error('Invalid profile data');
    }

    // Update user profile
    const success = await UserModel.updateProfile(userId, profileData);
    if (!success) {
      throw new Error('Failed to update user profile');
    }

    return true;
  } catch (error) {
    logError(error as Error);
    return false;
  }
};