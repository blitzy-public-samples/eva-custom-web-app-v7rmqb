/**
 * @file Sanity.io CMS Configuration Module
 * @version 1.0.0
 * @description Provides secure and optimized configuration for Sanity.io CMS integration
 * with enhanced validation, monitoring, and error handling capabilities.
 */

import { createClient } from '@sanity/client'; // v6.0.0

// Environment variables validation
const REQUIRED_ENV_VARS = [
  'SANITY_PROJECT_ID',
  'SANITY_DATASET',
  'SANITY_API_TOKEN'
] as const;

// Enhanced configuration interface with security and monitoring options
export interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token: string;
  useCdn: boolean;
  timeout: number;
  maxRetries: number;
  requestMonitoring: boolean;
}

// Custom error interface for Sanity-specific errors
export interface SanityError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

/**
 * Validates Sanity.io configuration parameters
 * @param config - Partial configuration object to validate
 * @returns boolean indicating if configuration is valid
 * @throws {Error} If required environment variables are missing
 */
const validateConfig = (config: Partial<SanityConfig>): boolean => {
  // Check required environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate project ID format (alphanumeric)
  if (config.projectId && !/^[a-zA-Z0-9]+$/.test(config.projectId)) {
    throw new Error('Invalid project ID format');
  }

  // Validate dataset name format (lowercase, alphanumeric, hyphens)
  if (config.dataset && !/^[a-z0-9-]+$/.test(config.dataset)) {
    throw new Error('Invalid dataset name format');
  }

  // Validate API token format (if provided)
  if (config.token && !/^sk[a-zA-Z0-9]+$/.test(config.token)) {
    throw new Error('Invalid API token format');
  }

  // Validate API version format (YYYY-MM-DD)
  if (config.apiVersion && !/^\d{4}-\d{2}-\d{2}$/.test(config.apiVersion)) {
    throw new Error('Invalid API version format');
  }

  return true;
};

/**
 * Monitors Sanity.io API requests for performance and errors
 * @param client - Configured Sanity client instance
 */
const monitorSanityRequests = (client: any): void => {
  const PERFORMANCE_THRESHOLD_MS = 1000;
  const ERROR_THRESHOLD = 5;
  let errorCount = 0;

  // Setup request interceptor for monitoring
  client.config().requestHook = (request: any, response: any) => {
    const startTime = Date.now();

    // Monitor request duration
    response.then(() => {
      const duration = Date.now() - startTime;
      if (duration > PERFORMANCE_THRESHOLD_MS) {
        console.warn(`Slow Sanity request detected: ${duration}ms`);
      }
    });

    // Monitor errors
    response.catch((error: SanityError) => {
      errorCount++;
      console.error('Sanity request error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });

      if (errorCount >= ERROR_THRESHOLD) {
        console.error('High error rate detected in Sanity requests');
        // Reset counter after alerting
        errorCount = 0;
      }
    });
  };
};

/**
 * Creates and configures Sanity.io client instance with enhanced security and monitoring
 * @param options - Optional configuration overrides
 * @returns Configured Sanity client instance
 */
const createSanityClient = (options: Partial<SanityConfig> = {}) => {
  // Default configuration with security and performance settings
  const defaultConfig: SanityConfig = {
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || '2024-02-15',
    token: process.env.SANITY_API_TOKEN!,
    useCdn: process.env.SANITY_CDN_ENABLED === 'true',
    timeout: 30000,
    maxRetries: 3,
    requestMonitoring: true
  };

  // Merge default config with provided options
  const config = { ...defaultConfig, ...options };

  // Validate configuration
  validateConfig(config);

  // Create client instance with security settings
  const client = createClient({
    ...config,
    // Additional security headers
    headers: {
      'X-Sanity-Client': 'estate-kit-backend',
      'X-Sanity-Client-Version': '1.0.0'
    },
    // Enable token-based authentication
    useProjectHostname: true,
    withCredentials: true
  });

  // Setup request monitoring if enabled
  if (config.requestMonitoring) {
    monitorSanityRequests(client);
  }

  return client;
};

// Create and export pre-configured Sanity client instance
export const sanityClient = createSanityClient();

// Export utility functions for external use
export {
  createSanityClient,
  validateConfig,
  monitorSanityRequests
};