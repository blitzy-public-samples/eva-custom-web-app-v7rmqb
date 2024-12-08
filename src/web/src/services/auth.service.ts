/**
 * Estate Kit - Authentication Service
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements authentication mechanisms such as login, logout, and token management.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Ensures role-based access control (RBAC) by managing user roles and permissions.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Handles sensitive authentication data securely, including token storage and retrieval.
 * 
 * Human Tasks:
 * 1. Configure Auth0 application settings in the Auth0 dashboard
 * 2. Set up environment variables for Auth0 configuration
 * 3. Verify token storage security requirements with security team
 * 4. Test role-based access control scenarios
 */

// External dependencies
// auth0 version 2.37.0
import { Auth0Client } from 'auth0';
// axios version ^1.3.4
import axios from 'axios';

// Internal dependencies
import { AuthTypes } from '../types/auth.types';
import { initializeAuth0, getAuthConfig } from '../config/auth.config';
import { validateAuth } from '../utils/validation.util';
import { makeRequest } from '../config/api.config';

// Constants for token storage
const TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'user_role';

/**
 * Handles user login by authenticating credentials and retrieving a token
 * @param credentials - User credentials containing email and password
 * @returns Promise resolving to the authentication token
 */
export const login = async (credentials: AuthTypes): Promise<string> => {
  try {
    // Validate credentials
    if (!validateAuth(credentials)) {
      throw new Error('Invalid credentials format');
    }

    // Initialize Auth0 client
    const auth0Client = initializeAuth0();

    // Authenticate with Auth0
    const authResult = await auth0Client.loginWithCredentials({
      username: credentials.email,
      password: credentials.password,
    });

    if (!authResult || !authResult.accessToken) {
      throw new Error('Authentication failed');
    }

    // Store token securely
    localStorage.setItem(TOKEN_KEY, authResult.accessToken);

    // Get and store user role
    const decodedToken = await auth0Client.getUser(authResult.accessToken);
    if (decodedToken && decodedToken['https://estatekit.com/roles']) {
      localStorage.setItem(ROLE_KEY, decodedToken['https://estatekit.com/roles'][0]);
    }

    return authResult.accessToken;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Authentication failed');
  }
};

/**
 * Logs out the user by clearing the authentication token and session data
 */
export const logout = async (): Promise<void> => {
  try {
    // Initialize Auth0 client
    const auth0Client = initializeAuth0();
    const config = getAuthConfig();

    // Clear stored tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);

    // Logout from Auth0
    await auth0Client.logout({
      returnTo: window.location.origin,
      clientId: config.clientId
    });

    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed');
  }
};

/**
 * Retrieves the stored authentication token for API requests
 * @returns The authentication token
 */
export const getToken = (): string => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Validate token format (JWT format check)
    if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
      throw new Error('Invalid token format');
    }

    return token;
  } catch (error) {
    console.error('Get token error:', error);
    throw new Error('Failed to retrieve authentication token');
  }
};

/**
 * Retrieves the role of the currently authenticated user
 * @returns The role of the user ('user', 'admin', or 'delegate')
 */
export const getUserRole = async (): Promise<AuthTypes['role']> => {
  try {
    // Check local storage first
    const storedRole = localStorage.getItem(ROLE_KEY) as AuthTypes['role'];
    if (storedRole && ['user', 'admin', 'delegate'].includes(storedRole)) {
      return storedRole;
    }

    // If not in local storage, fetch from Auth0
    const token = getToken();
    const auth0Client = initializeAuth0();
    const user = await auth0Client.getUser(token);

    if (!user || !user['https://estatekit.com/roles']) {
      throw new Error('User role not found');
    }

    const role = user['https://estatekit.com/roles'][0] as AuthTypes['role'];
    
    // Validate and store the role
    if (!['user', 'admin', 'delegate'].includes(role)) {
      throw new Error('Invalid role type');
    }

    localStorage.setItem(ROLE_KEY, role);
    return role;
  } catch (error) {
    console.error('Get user role error:', error);
    throw new Error('Failed to retrieve user role');
  }
};