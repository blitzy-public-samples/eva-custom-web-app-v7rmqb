/**
 * Estate Kit - Auth0 Configuration
 * Version: 1.0.0
 * 
 * This file configures the Auth0 client for authentication and authorization
 * in the Estate Kit backend system.
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
 * 1. Set up Auth0 tenant and configure application settings
 * 2. Configure environment variables for AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET
 * 3. Set up Auth0 roles and permissions in the Auth0 dashboard
 * 4. Configure token expiration and refresh token settings
 */

// @package auth0 v2.37.0
import { ManagementClient, AuthenticationClient } from 'auth0';
import { encryptData } from '../utils/encryption.util';
import { logError } from '../utils/logger.util';

// Environment variables for Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

// Auth0 client instances
let managementClient: ManagementClient;
let authClient: AuthenticationClient;

/**
 * Initializes the Auth0 Management and Authentication clients
 * Implements requirement: Authentication - Auth0 client setup
 * 
 * @returns Object containing both Auth0 client instances
 * @throws Error if environment variables are not configured
 */
export const initializeAuth0 = () => {
  try {
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
      throw new Error('Missing required Auth0 configuration environment variables');
    }

    // Initialize Auth0 Management client
    managementClient = new ManagementClient({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      clientSecret: AUTH0_CLIENT_SECRET,
      scope: 'read:users update:users read:roles'
    });

    // Initialize Auth0 Authentication client
    authClient = new AuthenticationClient({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      clientSecret: AUTH0_CLIENT_SECRET
    });

    return {
      managementClient,
      authClient
    };
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize Auth0 clients');
  }
};

/**
 * Validates a JWT token using Auth0's public key
 * Implements requirement: Data Security - Token validation
 * 
 * @param token - The JWT token to validate
 * @returns The decoded token payload if validation is successful
 * @throws Error if token validation fails
 */
export const validateToken = async (token: string) => {
  try {
    if (!authClient) {
      throw new Error('Auth0 client not initialized');
    }

    // Verify and decode the token
    const decodedToken = await authClient.tokens.verify({
      token,
      audience: AUTH0_CLIENT_ID,
      issuer: `https://${AUTH0_DOMAIN}/`
    });

    // Encrypt sensitive data before returning
    const encryptedPayload = {
      ...decodedToken,
      sub: encryptData(decodedToken.sub as string, process.env.ENCRYPTION_KEY as string)
    };

    return encryptedPayload;
  } catch (error) {
    logError(error as Error);
    throw new Error('Token validation failed');
  }
};

/**
 * Fetches the roles assigned to a user from Auth0
 * Implements requirement: Role-Based Access Control - Role management
 * 
 * @param userId - The Auth0 user ID
 * @returns Array of roles assigned to the user
 * @throws Error if role fetching fails
 */
export const getUserRoles = async (userId: string) => {
  try {
    if (!managementClient) {
      throw new Error('Auth0 client not initialized');
    }

    // Fetch user roles from Auth0
    const roles = await managementClient.getUserRoles({ id: userId });

    // Map roles to internal format
    const mappedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions || []
    }));

    return mappedRoles;
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to fetch user roles');
  }
};