/**
 * @fileoverview Authentication configuration for Estate Kit frontend application
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides configuration for authentication mechanisms in the frontend application.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements role-based access control (RBAC) using Auth0 roles and permissions.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of sensitive authentication data.
 * 
 * Human Tasks:
 * 1. Create and configure an Auth0 application in the Auth0 dashboard
 * 2. Set up the following environment variables in .env file:
 *    - REACT_APP_AUTH0_DOMAIN=your-tenant.region.auth0.com
 *    - REACT_APP_AUTH0_CLIENT_ID=your-client-id
 * 3. Configure allowed callback URLs and logout URLs in Auth0 dashboard
 * 4. Set up RBAC roles (user, admin, delegate) in Auth0 dashboard
 */

// @auth0/auth0-react version 2.37.0
import { Auth0Client } from '@auth0/auth0-react';
import { AuthTypes } from '../types/auth.types';

// Environment variables for Auth0 configuration
const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID;

/**
 * Initializes and configures the Auth0 client for the frontend application.
 * This function sets up the Auth0 client with the necessary configuration
 * for authentication and authorization.
 * 
 * @returns {Auth0Client} Configured Auth0 client instance
 * @throws {Error} If required environment variables are not set
 */
export const initializeAuth0 = (): Auth0Client => {
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
        throw new Error('Required Auth0 environment variables are not set');
    }

    return new Auth0Client({
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        // Configure Auth0 client options
        authorizationParams: {
            redirect_uri: window.location.origin,
            audience: `https://${AUTH0_DOMAIN}/api/v2/`,
            scope: 'openid profile email',
        },
        // Enable RBAC and token refresh
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
        useRefreshTokensFallback: true,
    });
};

/**
 * Retrieves the authentication configuration settings.
 * This function provides access to the Auth0 configuration parameters
 * needed for authentication setup.
 * 
 * @returns {{ domain: string; clientId: string }} Auth0 configuration object
 * @throws {Error} If required environment variables are not set
 */
export const getAuthConfig = (): { domain: string; clientId: string } => {
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
        throw new Error('Required Auth0 environment variables are not set');
    }

    return {
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
    };
};

/**
 * Type guard to validate Auth0 role against AuthTypes role
 * Ensures type safety when working with role-based access control
 * 
 * @param role - Role string to validate
 * @returns {boolean} Whether the role is valid according to AuthTypes
 */
export const isValidRole = (role: string): role is AuthTypes['role'] => {
    return ['user', 'admin', 'delegate'].includes(role as AuthTypes['role']);
};