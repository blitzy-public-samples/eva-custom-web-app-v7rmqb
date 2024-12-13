// shopify.ts - Shopify e-commerce integration configuration
// External dependencies
// dotenv: ^16.0.0 - Load environment variables securely
import dotenv from 'dotenv';
import { URL } from 'url';

// Load environment variables
dotenv.config();

/**
 * Interface defining comprehensive Shopify configuration structure
 * with enhanced security and validation requirements
 */
interface IShopifyConfig {
  apiUrl: string;
  accessToken: string;
  webhookSecret: string;
  shopName: string;
  apiVersion: string;
  retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  timeouts: {
    request: number;
    connect: number;
  };
  webhookEndpoints: {
    orderCreated: string;
    orderFulfilled: string;
    orderCancelled: string;
  };
  security: {
    enableIPWhitelist: boolean;
    allowedIPs: string[];
  };
}

/**
 * Validates required Shopify configuration values with enhanced error handling
 * Throws detailed errors for invalid or missing configurations
 */
export const validateConfig = (): void => {
  // Validate API URL
  if (!process.env.SHOPIFY_API_URL) {
    throw new Error('SHOPIFY_API_URL environment variable is required');
  }
  
  try {
    new URL(process.env.SHOPIFY_API_URL);
  } catch (error) {
    throw new Error('SHOPIFY_API_URL must be a valid URL');
  }

  // Validate Access Token
  if (!process.env.SHOPIFY_ACCESS_TOKEN) {
    throw new Error('SHOPIFY_ACCESS_TOKEN environment variable is required');
  }
  
  if (process.env.SHOPIFY_ACCESS_TOKEN.length < 32) {
    throw new Error('SHOPIFY_ACCESS_TOKEN must be at least 32 characters long');
  }

  // Validate Webhook Secret
  if (!process.env.SHOPIFY_WEBHOOK_SECRET) {
    throw new Error('SHOPIFY_WEBHOOK_SECRET environment variable is required');
  }
  
  if (process.env.SHOPIFY_WEBHOOK_SECRET.length < 32) {
    throw new Error('SHOPIFY_WEBHOOK_SECRET must be at least 32 characters long');
  }

  // Validate Shop Name
  if (!process.env.SHOPIFY_SHOP_NAME) {
    throw new Error('SHOPIFY_SHOP_NAME environment variable is required');
  }
  
  if (!/^[a-zA-Z0-9-]+$/.test(process.env.SHOPIFY_SHOP_NAME)) {
    throw new Error('SHOPIFY_SHOP_NAME must contain only alphanumeric characters and hyphens');
  }
};

/**
 * Shopify configuration object with comprehensive settings
 * and enhanced security features
 */
export const shopifyConfig: IShopifyConfig = {
  // Core API Configuration
  apiUrl: process.env.SHOPIFY_API_URL || '',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
  shopName: process.env.SHOPIFY_SHOP_NAME || '',
  apiVersion: '2024-01', // Latest stable API version

  // Retry Configuration for API Requests
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 5000,  // 5 seconds
  },

  // Request Timeouts
  timeouts: {
    request: 30000,  // 30 seconds
    connect: 5000,   // 5 seconds
  },

  // Webhook Endpoint Configuration
  webhookEndpoints: {
    orderCreated: '/webhooks/shopify/order-created',
    orderFulfilled: '/webhooks/shopify/order-fulfilled',
    orderCancelled: '/webhooks/shopify/order-cancelled',
  },

  // Security Configuration
  security: {
    enableIPWhitelist: true,
    allowedIPs: process.env.SHOPIFY_ALLOWED_IPS ? 
      process.env.SHOPIFY_ALLOWED_IPS.split(',').map(ip => ip.trim()) : 
      [],
  },
};

// Validate configuration on module load
validateConfig();

// Export the configuration interface for type checking
export type { IShopifyConfig };

// Export individual configuration sections for granular access
export const {
  apiUrl,
  accessToken,
  webhookSecret,
  shopName,
  apiVersion,
  retryConfig,
  timeouts,
  webhookEndpoints,
  security,
} = shopifyConfig;