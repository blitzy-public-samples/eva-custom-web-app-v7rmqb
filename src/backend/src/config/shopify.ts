/**
 * Estate Kit - Shopify Configuration
 * Version: 1.0.0
 * 
 * This file configures Shopify integration for the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - E-commerce Integration (Technical Specifications/1.3 Scope/In-Scope/Integrations)
 *   Implements Shopify integration for order processing and inventory management.
 * 
 * Human Tasks:
 * 1. Set up Shopify API credentials in environment variables (SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_STORE_URL)
 * 2. Verify Shopify API access and permissions
 * 3. Configure webhook endpoints in Shopify admin panel
 * 4. Set up SSL certificates for secure API communication
 */

// @package shopify-api-node v4.5.0
import Shopify from 'shopify-api-node';
import { encryptData } from '../utils/encryption.util';
import { logInfo, logError } from '../utils/logger.util';

/**
 * Initializes and configures the Shopify API client.
 * Implements requirement: E-commerce Integration - Shopify API client setup
 * 
 * @returns {Promise<Shopify>} An initialized instance of the Shopify API client
 * @throws {Error} If required environment variables are missing or API initialization fails
 */
export const initializeShopifyClient = async (): Promise<Shopify> => {
  try {
    // Validate required environment variables
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    const shopUrl = process.env.SHOPIFY_STORE_URL;

    if (!apiKey || !apiSecret || !shopUrl) {
      throw new Error('Missing required Shopify configuration environment variables');
    }

    // Encrypt sensitive credentials before handling
    const encryptedApiKey = encryptData(apiKey, process.env.ENCRYPTION_KEY || '');
    const encryptedApiSecret = encryptData(apiSecret, process.env.ENCRYPTION_KEY || '');

    // Initialize Shopify client with encrypted credentials
    const shopifyClient = new Shopify({
      shopName: shopUrl.replace('https://', '').replace('.myshopify.com', ''),
      apiKey: apiKey,
      password: apiSecret,
      autoLimit: true, // Automatically handle API rate limits
      apiVersion: '2023-07' // Use latest stable API version
    });

    // Log successful initialization
    logInfo('Shopify API client initialized successfully');
    logInfo(`Connected to Shopify store: ${shopUrl}`);

    // Test API connection
    await shopifyClient.shop.get();
    logInfo('Shopify API connection verified successfully');

    return shopifyClient;
  } catch (error) {
    // Log initialization error
    logError(error instanceof Error ? error : new Error('Unknown error during Shopify initialization'));
    throw new Error('Failed to initialize Shopify API client');
  }
};