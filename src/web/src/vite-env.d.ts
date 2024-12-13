/// <reference types="vite/client" />

/**
 * Type declaration for Estate Kit environment variables
 * Extends Vite's ImportMetaEnv interface to ensure type safety across the application
 * @version 4.3.0 (Vite)
 */
interface ImportMetaEnv {
  /**
   * Base URL for the Estate Kit API Gateway
   * Used for all API communications
   * @example 'https://api.estatekit.com'
   */
  readonly VITE_API_URL: string;

  /**
   * Auth0 tenant domain for authentication and identity management
   * @example 'estatekit.auth0.com'
   */
  readonly VITE_AUTH0_DOMAIN: string;

  /**
   * Auth0 application client ID for frontend authentication
   * @example 'your-auth0-client-id'
   */
  readonly VITE_AUTH0_CLIENT_ID: string;

  /**
   * Auth0 API audience identifier for API access control
   * @example 'https://api.estatekit.com'
   */
  readonly VITE_AUTH0_AUDIENCE: string;

  /**
   * Auth0 redirect URI after successful authentication
   * @example 'https://app.estatekit.com/callback'
   */
  readonly VITE_AUTH0_REDIRECT_URI: string;

  /**
   * Intercom application ID for customer support widget integration
   * @example 'your-intercom-app-id'
   */
  readonly VITE_INTERCOM_APP_ID: string;

  /**
   * Application environment identifier
   * Used for environment-specific behavior
   * @example 'development' | 'staging' | 'production'
   */
  readonly VITE_APP_ENV: string;
}

/**
 * Type declaration to ensure ImportMetaEnv is defined on the ImportMeta interface
 * This is required for Vite's environment variable type inference
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}