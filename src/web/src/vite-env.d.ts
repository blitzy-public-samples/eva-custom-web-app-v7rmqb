// TypeScript v4.9+ required
/// <reference types="vite/client" />

/**
 * @requirements Frontend Build Optimization
 * Defines type-safe environment variables for the Vite build process
 * as specified in Technical Specifications/4.5 Development & Deployment/Deployment Pipeline
 */
interface ImportMetaEnv {
  /**
   * Base URL for API endpoints
   * @type {string}
   */
  readonly VITE_API_BASE_URL: string;
}

/**
 * Extends the ImportMeta interface to include our custom env variables
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Exported interface for use in Vite configuration and other TypeScript files
 */
export interface ViteEnv {
  VITE_API_BASE_URL: string;
}