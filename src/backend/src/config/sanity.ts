// @sanity/client v3.4.0
import { createClient } from '@sanity/client';
import { logInfo, logError } from '../utils/logger.util';
import { encryptData } from '../utils/encryption.util';

/**
 * Human Tasks:
 * 1. Set up Sanity.io project and obtain project ID, dataset name, and API token
 * 2. Configure environment variables (SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN)
 * 3. Review and set up appropriate CORS settings in Sanity.io dashboard
 * 4. Implement monitoring for Sanity.io API rate limits and usage
 */

// Requirement: Content Management - Implements integration with Sanity.io for managing and delivering content
const SANITY_CONFIG = {
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2021-10-21', // Use a specific API version for stability
  useCdn: process.env.NODE_ENV === 'production', // Use CDN in production for better performance
  token: process.env.SANITY_API_TOKEN
};

/**
 * Initializes the Sanity.io client with the necessary configuration.
 * Requirement: Content Management - Configures secure connection to Sanity.io CMS
 * 
 * @returns An instance of the Sanity.io client
 * @throws Error if required environment variables are missing
 */
export const initializeSanityClient = () => {
  try {
    if (!SANITY_CONFIG.projectId || !SANITY_CONFIG.dataset || !SANITY_CONFIG.token) {
      throw new Error('Missing required Sanity.io configuration');
    }

    // Encrypt the API token for secure logging
    const encryptedToken = encryptData(SANITY_CONFIG.token);

    const client = createClient({
      projectId: SANITY_CONFIG.projectId,
      dataset: SANITY_CONFIG.dataset,
      apiVersion: SANITY_CONFIG.apiVersion,
      useCdn: SANITY_CONFIG.useCdn,
      token: SANITY_CONFIG.token
    });

    logInfo(`Sanity.io client initialized for project: ${SANITY_CONFIG.projectId}`);
    return client;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to initialize Sanity client'));
    throw error;
  }
};

/**
 * Fetches content from the Sanity.io CMS based on a given query.
 * Requirement: Content Management - Implements content retrieval functionality
 * 
 * @param query - GROQ query string to fetch specific content
 * @param params - Parameters for the GROQ query
 * @returns The content fetched from the Sanity.io CMS
 */
export const fetchContent = async (query: string, params: Record<string, any>) => {
  try {
    const client = initializeSanityClient();
    logInfo(`Executing Sanity.io query: ${query}`);
    const result = await client.fetch(query, params);
    return result;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to fetch content from Sanity'));
    throw error;
  }
};

/**
 * Updates content in the Sanity.io CMS based on a given document ID and update data.
 * Requirement: Content Management - Implements content update functionality
 * 
 * @param documentId - ID of the document to update
 * @param updateData - Object containing the update data
 * @returns The updated content document
 */
export const updateContent = async (documentId: string, updateData: Record<string, any>) => {
  try {
    const client = initializeSanityClient();
    logInfo(`Updating Sanity.io document: ${documentId}`);
    
    // Validate document ID
    if (!documentId.startsWith('draft.') && !documentId.match(/^[a-z0-9]+-[a-z0-9]+$/)) {
      throw new Error('Invalid document ID format');
    }

    const result = await client
      .patch(documentId)
      .set(updateData)
      .commit({
        // Add auto-generated revision ID for tracking changes
        autoGenerateArrayKeys: true
      });

    return result;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to update content in Sanity'));
    throw error;
  }
};