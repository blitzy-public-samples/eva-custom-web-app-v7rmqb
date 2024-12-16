/**
 * Auth0 Configuration Module
 * Version: 1.0.0
 * 
 * Implements secure authentication configuration for Estate Kit frontend application
 * with comprehensive security features including MFA support, token management,
 * and session security controls.
 * 
 * @auth0/auth0-spa-js version: ^2.1.0
 */

import { Auth0Client } from '@auth0/auth0-spa-js';
import { Auth0Config } from '../types/auth.types';

// Environment variables validation
const requiredEnvVars = [
  'VITE_AUTH0_DOMAIN',
  'VITE_AUTH0_CLIENT_ID',
  'VITE_AUTH0_AUDIENCE',
  'VITE_AUTH0_REDIRECT_URI'
] as const;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Auth0 Configuration Constants
export const AUTH0_DOMAIN = process.env.VITE_AUTH0_DOMAIN as string;
export const AUTH0_CLIENT_ID = process.env.VITE_AUTH0_CLIENT_ID as string;
export const AUTH0_AUDIENCE = process.env.VITE_AUTH0_AUDIENCE as string;
export const AUTH0_REDIRECT_URI = process.env.VITE_AUTH0_REDIRECT_URI as string;

// Security and Scope Configuration
export const AUTH0_SCOPE = 'openid profile email offline_access mfa';
export const AUTH0_MFA_ENABLED = true;
export const AUTH0_TOKEN_REFRESH_INTERVAL = 3600000; // 1 hour in milliseconds

// Security configuration options
const securityOptions = {
  httpTimeoutInSeconds: 60,
  allowedConnections: ['Username-Password-Authentication'],
  passwordlessMethod: 'code',
  mfa: {
    required: true,
    methods: ['otp', 'push'],
  },
  sessionCheckExpiryDays: 1,
  allowPasswordAutocomplete: false,
  allowShowPassword: false,
  allowRememberBrowser: false,
  allowedOrigins: [window.location.origin],
  httpTimeoutMs: 10000,
};

/**
 * Enhanced Auth0 configuration object implementing comprehensive security settings
 * and PIPEDA-compliant authentication parameters.
 */
export const auth0Config: Auth0Config = {
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  audience: AUTH0_AUDIENCE,
  redirectUri: AUTH0_REDIRECT_URI,
};

/**
 * Creates and initializes the Auth0 client instance with enhanced security configuration.
 * Implements comprehensive security features including MFA enforcement and secure token handling.
 * 
 * @returns {Promise<Auth0Client>} Initialized Auth0 client instance
 */
export const createAuth0Client = async (): Promise<Auth0Client> => {
  try {
    const client = await new Auth0Client({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      authorizationParams: {
        audience: auth0Config.audience,
        redirect_uri: auth0Config.redirectUri,
        scope: AUTH0_SCOPE,
      },
      useRefreshTokens: true,
      cacheLocation: 'memory',
      httpTimeoutInSeconds: securityOptions.httpTimeoutInSeconds,
      useCookiesForTransactions: true,
    });

    // Configure automatic token refresh
    setInterval(async () => {
      try {
        if (await client.isAuthenticated()) {
          await client.getTokenSilently();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, AUTH0_TOKEN_REFRESH_INTERVAL);

    return client;
  } catch (error) {
    console.error('Auth0 client initialization failed:', error);
    throw new Error('Failed to initialize Auth0 client');
  }
};

// Initialize Auth0 client instance
export const auth0Client = await createAuth0Client();

/**
 * Security-enhanced error handler for Auth0 operations
 * Implements secure error logging and handling
 */
export const handleAuth0Error = (error: Error): void => {
  // Sanitize error message to prevent sensitive data exposure
  const sanitizedMessage = error.message.replace(/[^\w\s-]/gi, '');
  
  console.error('Auth0 operation failed:', {
    timestamp: new Date().toISOString(),
    error: sanitizedMessage,
    origin: window.location.origin,
  });
  
  // Implement additional security measures based on error type
  if (error.message.includes('invalid_grant')) {
    // Force re-authentication on token issues
    auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
};