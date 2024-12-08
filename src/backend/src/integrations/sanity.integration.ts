/**
 * Estate Kit - Sanity.io Integration
 * Version: 1.0.0
 * 
 * This file implements the integration between Estate Kit backend and Sanity.io CMS.
 * 
 * Requirements Addressed:
 * - Content Management (Technical Specifications/1.3 Scope/In-Scope/Integrations)
 *   Implements integration with Sanity.io for managing and delivering content.
 * 
 * Human Tasks:
 * 1. Verify Sanity.io project configuration and access credentials
 * 2. Set up content models and schemas in Sanity.io studio
 * 3. Configure CORS settings in Sanity.io for the backend domain
 * 4. Implement monitoring for Sanity.io API rate limits
 */

import { 
  initializeSanityClient, 
  fetchContent, 
  updateContent 
} from '../config/sanity';
import { 
  logInfo, 
  logError 
} from '../utils/logger.util';
import { handleError } from '../utils/error.util';

/**
 * Synchronizes content between Estate Kit backend and Sanity.io CMS.
 * Requirement: Content Management - Implements content synchronization with Sanity.io
 * 
 * @param query - GROQ query string to fetch specific content
 * @param params - Parameters for the GROQ query
 * @returns The synchronized content from Sanity.io
 * @throws Error if synchronization fails
 */
export const syncSanityContent = async (
  query: string,
  params: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    // Initialize Sanity client
    initializeSanityClient();
    
    logInfo(`Starting content synchronization with Sanity.io - Query: ${query}`);

    // Validate query string
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid GROQ query provided');
    }

    // Validate params object
    if (!params || typeof params !== 'object') {
      throw new Error('Invalid query parameters provided');
    }

    // Fetch content from Sanity.io
    const content = await fetchContent(query, params);

    logInfo(`Successfully synchronized content from Sanity.io - Query: ${query}`);

    return content;
  } catch (error) {
    // Handle and log any errors during synchronization
    handleError(error instanceof Error ? error : new Error('Failed to sync content from Sanity.io'));
    throw error;
  }
};

/**
 * Updates a specific document in the Sanity.io CMS.
 * Requirement: Content Management - Implements content update functionality
 * 
 * @param documentId - ID of the document to update
 * @param updateData - Object containing the update data
 * @returns The updated document from Sanity.io
 * @throws Error if update fails
 */
export const updateSanityDocument = async (
  documentId: string,
  updateData: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    // Initialize Sanity client
    initializeSanityClient();
    
    logInfo(`Starting document update in Sanity.io - Document ID: ${documentId}`);

    // Validate document ID
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('Invalid document ID provided');
    }

    // Validate update data
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Invalid update data provided');
    }

    // Update document in Sanity.io
    const updatedDocument = await updateContent(documentId, updateData);

    logInfo(`Successfully updated document in Sanity.io - Document ID: ${documentId}`);

    return updatedDocument;
  } catch (error) {
    // Handle and log any errors during update
    handleError(error instanceof Error ? error : new Error('Failed to update document in Sanity.io'));
    throw error;
  }
};