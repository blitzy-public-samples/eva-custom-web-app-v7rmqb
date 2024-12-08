/**
 * Estate Kit - Document Management Hook
 * 
 * Requirements addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements frontend logic for managing documents, including fetching, uploading, and updating document data.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent formatting of user-facing data such as dates across the web application.
 * 
 * Human Tasks:
 * 1. Verify error handling strategies align with UX requirements
 * 2. Test document upload size limits with backend team
 * 3. Review loading state indicators with design team
 * 4. Confirm document validation rules with backend team
 */

// react version ^18.2.0
import { useState, useCallback, useEffect } from 'react';

// Internal imports
import { DocumentTypes } from '../types/document.types';
import { 
  fetchDocuments, 
  uploadDocument, 
  updateDocument 
} from '../services/document.service';
import { validateDocument } from '../utils/validation.util';
import { formatDocumentDates } from '../utils/date.util';

interface UseDocumentReturn {
  documents: DocumentTypes[];
  loading: boolean;
  error: Error | null;
  fetchAllDocuments: () => Promise<void>;
  uploadNewDocument: (formData: FormData) => Promise<DocumentTypes>;
  updateExistingDocument: (document: DocumentTypes) => Promise<DocumentTypes>;
  formatDates: (document: DocumentTypes) => { createdAt: string; updatedAt: string; };
}

/**
 * Custom React hook for managing document-related operations.
 * Provides functionality for fetching, uploading, and updating documents.
 * 
 * @returns Object containing document state and management functions
 */
const useDocument = (): UseDocumentReturn => {
  // State management for documents
  const [documents, setDocuments] = useState<DocumentTypes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches all documents from the backend.
   * Implements document retrieval functionality.
   */
  const fetchAllDocuments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const fetchedDocuments = await fetchDocuments();
      
      // Validate fetched documents
      fetchedDocuments.forEach(doc => {
        if (!validateDocument(doc)) {
          throw new Error(`Invalid document data received: ${JSON.stringify(doc)}`);
        }
      });

      setDocuments(fetchedDocuments);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch documents');
      setError(error);
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Uploads a new document to the backend.
   * Implements document upload functionality.
   * 
   * @param formData - FormData object containing the document file and metadata
   * @returns Promise resolving to the uploaded document
   */
  const uploadNewDocument = useCallback(async (formData: FormData): Promise<DocumentTypes> => {
    setLoading(true);
    setError(null);

    try {
      const uploadedDocument = await uploadDocument(formData);

      // Validate uploaded document
      if (!validateDocument(uploadedDocument)) {
        throw new Error('Invalid document data received from upload');
      }

      // Update documents state with new document
      setDocuments(prevDocuments => [...prevDocuments, uploadedDocument]);

      return uploadedDocument;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload document');
      setError(error);
      console.error('Error uploading document:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Updates an existing document in the backend.
   * Implements document update functionality.
   * 
   * @param document - Document object containing updated data
   * @returns Promise resolving to the updated document
   */
  const updateExistingDocument = useCallback(async (document: DocumentTypes): Promise<DocumentTypes> => {
    setLoading(true);
    setError(null);

    try {
      // Validate document before update
      if (!validateDocument(document)) {
        throw new Error('Invalid document data provided for update');
      }

      const updatedDocument = await updateDocument(document);

      // Validate updated document
      if (!validateDocument(updatedDocument)) {
        throw new Error('Invalid document data received from update');
      }

      // Update documents state with updated document
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.documentId === updatedDocument.documentId ? updatedDocument : doc
        )
      );

      return updatedDocument;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update document');
      setError(error);
      console.error('Error updating document:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Formats document dates for display.
   * Implements consistent date formatting across the application.
   * 
   * @param document - Document object containing dates to format
   * @returns Object containing formatted createdAt and updatedAt dates
   */
  const formatDates = useCallback((document: DocumentTypes) => {
    return formatDocumentDates(document);
  }, []);

  // Fetch documents on initial mount
  useEffect(() => {
    fetchAllDocuments();
  }, [fetchAllDocuments]);

  return {
    documents,
    loading,
    error,
    fetchAllDocuments,
    uploadNewDocument,
    updateExistingDocument,
    formatDates,
  };
};

export default useDocument;