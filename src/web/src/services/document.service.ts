/**
 * Estate Kit - Document Service
 * 
 * Requirements addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements the frontend logic for managing documents, including fetching, uploading, and updating document data.
 * - API Integration (Technical Specifications/2.3 API Design/API Specifications)
 *   Handles API interactions for document-related operations, ensuring secure and efficient communication with the backend.
 * 
 * Human Tasks:
 * 1. Verify API endpoint URLs match the backend configuration
 * 2. Test document upload size limits and supported file types
 * 3. Review error handling and retry strategies for API requests
 * 4. Confirm document validation rules with backend team
 */

// axios version ^1.3.4
import { DocumentTypes } from '../types/document.types';
import { API_BASE_URL, makeRequest } from '../config/api.config';
import { validateDocument } from '../utils/validation.util';
import { formatDocumentDates } from '../utils/date.util';

/**
 * Fetches a list of documents from the backend API.
 * Implements document retrieval functionality as specified in the Document Management requirement.
 * 
 * @returns Promise<DocumentTypes[]> A promise resolving to an array of document objects
 * @throws Error if the API request fails or validation fails
 */
export async function fetchDocuments(): Promise<DocumentTypes[]> {
  try {
    const response = await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/documents`,
    });

    // Validate each document in the response
    const documents = response.data.map((doc: any) => {
      if (!validateDocument(doc)) {
        throw new Error(`Invalid document data received: ${JSON.stringify(doc)}`);
      }
      return doc;
    });

    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Failed to fetch documents');
  }
}

/**
 * Uploads a new document to the backend API.
 * Implements document upload functionality as specified in the Document Management requirement.
 * 
 * @param formData - FormData object containing the document file and metadata
 * @returns Promise<DocumentTypes> A promise resolving to the uploaded document object
 * @throws Error if the API request fails or validation fails
 */
export async function uploadDocument(formData: FormData): Promise<DocumentTypes> {
  try {
    const response = await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/documents`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Validate the response data
    if (!validateDocument(response.data)) {
      throw new Error('Invalid document data received from upload');
    }

    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  }
}

/**
 * Updates an existing document in the backend API.
 * Implements document update functionality as specified in the Document Management requirement.
 * 
 * @param document - Document object containing updated data
 * @returns Promise<DocumentTypes> A promise resolving to the updated document object
 * @throws Error if the API request fails or validation fails
 */
export async function updateDocument(document: DocumentTypes): Promise<DocumentTypes> {
  try {
    // Validate the input document before sending
    if (!validateDocument(document)) {
      throw new Error('Invalid document data provided for update');
    }

    const response = await makeRequest({
      method: 'PUT',
      url: `${API_BASE_URL}/documents/${document.documentId}`,
      data: document,
    });

    // Validate the response data
    if (!validateDocument(response.data)) {
      throw new Error('Invalid document data received from update');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document');
  }
}

/**
 * Formats the createdAt and updatedAt dates of a document for display purposes.
 * Implements consistent date formatting across the application.
 * 
 * @param document - Document object containing dates to format
 * @returns Object containing formatted createdAt and updatedAt dates
 * @throws Error if the document validation fails
 */
export function formatDocumentDatesForDisplay(document: DocumentTypes): {
  createdAt: string;
  updatedAt: string;
} {
  try {
    // Validate the input document
    if (!validateDocument(document)) {
      throw new Error('Invalid document provided for date formatting');
    }

    // Format the dates using the date utility
    return formatDocumentDates(document);
  } catch (error) {
    console.error('Error formatting document dates:', error);
    throw new Error('Failed to format document dates');
  }
}