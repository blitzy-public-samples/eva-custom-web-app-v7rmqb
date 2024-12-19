// @ts-check
import { ManagementClientOptions, AuthenticationClientOptions } from 'auth0';  // auth0 v3.0.0

/**
 * Environment variable validation interface
 */
interface EnvValidation {
  name: string;
  value: string | undefined;
}

/**
 * Validates required environment variables
 * @param {EnvValidation[]} requiredVars - Array of required environment variables
 * @throws {Error} If any required environment variable is missing
 */
const validateEnvVariables = (requiredVars: EnvValidation[]): void => {
  const missingVars = requiredVars
    .filter(({ value }) => !value)
    .map(({ name }) => name);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

// Validate critical Auth0 environment variables
const requiredAuthVars = [
  { name: 'AUTH0_DOMAIN', value: process.env.AUTH0_DOMAIN },
  { name: 'AUTH0_CLIENT_ID', value: process.env.AUTH0_CLIENT_ID },
  { name: 'AUTH0_CLIENT_SECRET', value: process.env.AUTH0_CLIENT_SECRET },
  { name: 'AUTH0_AUDIENCE', value: process.env.AUTH0_AUDIENCE },
  { name: 'AUTH0_ISSUER', value: process.env.AUTH0_ISSUER }
];

validateEnvVariables(requiredAuthVars);

/**
 * Enhanced Auth0 configuration with comprehensive security settings
 */
export const AUTH0_CONFIG = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!,
  issuer: process.env.AUTH0_ISSUER!,
  scope: 'openid profile email',
  mfaEnabled: true,
  passwordPolicy: 'good',
  tokenLifetime: 3600, // 1 hour in seconds
  brute_force_protection: true,
  allowedConnections: ['Username-Password-Authentication'],
  universalLoginWithRedirect: true,
  enabledLocales: ['en'],
  defaultLocale: 'en'
} as const;

/**
 * Enhanced JWT configuration with security controls
 */
export const JWT_CONFIG = {
  algorithms: ['RS256'] as const,
  issuer: process.env.AUTH0_ISSUER!,
  audience: process.env.AUTH0_AUDIENCE!,
  tokenExpiryTime: 3600,
  clockTolerance: 60, // 1 minute clock skew tolerance
  maxAge: '1h',
  ignoreExpiration: false,
  ignoreNotBefore: false
} as const;

/**
 * Enhanced Management API configuration with security features
 */
const MANAGEMENT_API_CONFIG = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  scope: 'read:users update:users create:users delete:users create:user_tickets read:logs read:stats',
  tokenProvider: {
    enableCache: true,
    cacheTTLInSeconds: 3600
  },
  retry: {
    enabled: true,
    maxRetries: 3
  }
} as const;

/**
 * Returns enhanced configuration for Auth0 Management API client
 * @returns {ManagementClientOptions} Secure configuration object for Auth0 Management API
 */
export const getManagementConfig = (): ManagementClientOptions => {
  try {
    return {
      domain: MANAGEMENT_API_CONFIG.domain,
      clientId: MANAGEMENT_API_CONFIG.clientId,
      clientSecret: MANAGEMENT_API_CONFIG.clientSecret,
      tokenProvider: {
        ...MANAGEMENT_API_CONFIG.tokenProvider
      },
      retry: {
        ...MANAGEMENT_API_CONFIG.retry
      }
    };
  } catch (error) {
    throw new Error(`Failed to generate Management API configuration: ${error}`);
  }
};

/**
 * Returns secure configuration for Auth0 Authentication API client
 * @returns {AuthenticationClientOptions} Secure configuration object for Auth0 Authentication API
 */
export const getAuthenticationConfig = (): AuthenticationClientOptions => {
  try {
    return {
      domain: AUTH0_CONFIG.domain,
      clientId: AUTH0_CONFIG.clientId,
      clientSecret: AUTH0_CONFIG.clientSecret,
      headers: {
        'Auth0-Client': Buffer.from(JSON.stringify({
          name: 'estate-kit-backend',
          version: '1.0.0',
          env: {
            node: process.version
          }
        })).toString('base64')
      }
    };
  } catch (error) {
    throw new Error(`Failed to generate Authentication API configuration: ${error}`);
  }
};

/**
 * Environment-specific configuration overrides
 */
if (process.env.NODE_ENV === 'development') {
  Object.assign(AUTH0_CONFIG, {
    tokenLifetime: 86400, // 24 hours in development
    clockTolerance: 120 // 2 minutes clock skew tolerance in development
  });
}

// Export additional configuration settings
export const auth0Config = {
  domain: AUTH0_CONFIG.domain,
  clientId: AUTH0_CONFIG.clientId,
  clientSecret: AUTH0_CONFIG.clientSecret,
  audience: AUTH0_CONFIG.audience,
  issuer: AUTH0_CONFIG.issuer,
  mfaEnabled: AUTH0_CONFIG.mfaEnabled
};

export const jwtConfig = {
  algorithms: JWT_CONFIG.algorithms,
  issuer: JWT_CONFIG.issuer,
  audience: JWT_CONFIG.audience,
  tokenExpiryTime: JWT_CONFIG.tokenExpiryTime
};