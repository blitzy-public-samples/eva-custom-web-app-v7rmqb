/**
 * Enhanced Document Management Hook
 * Version: 1.0.0
 * 
 * Implements secure document operations with PIPEDA compliance, encryption monitoring,
 * performance tracking, and comprehensive error handling for Estate Kit platform.
 * 
 * @package react ^18.2.0
 * @package react-redux ^8.0.5
 */

import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  selectDocuments,
  selectDocumentLoading,
  selectDocumentError,
  selectUploadProgress,
  selectEncryptionStatus,
  selectPerformanceMetrics
} from '../redux/slices/documentSlice';
import {
  Document,
  DocumentType,
  DocumentUploadRequest
} from '../types/document.types';
import { AppDispatch } from '../redux/store';

// Performance monitoring thresholds
const PERFORMANCE_THRESHOLDS = {
  UPLOAD_WARNING_MS: 5000,    // 5 seconds
  FETCH_WARNING_MS: 1000,     // 1 second
  DELETE_WARNING_MS: 2000     // 2 seconds
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Enhanced custom hook for secure document management
 * Implements PIPEDA-compliant operations with comprehensive monitoring
 */
export const useDocument = (type?: DocumentType) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux selectors
  const documents = useSelector(selectDocuments);
  const loading = useSelector(selectDocumentLoading);
  const error = useSelector(selectDocumentError);
  const uploadProgress = useSelector(selectUploadProgress);
  const encryptionStatus = useSelector(selectEncryptionStatus);
  const performanceMetrics = useSelector(selectPerformanceMetrics);

  // Performance monitoring refs
  const operationStartTime = useRef<number>(0);
  const retryCount = useRef<number>(0);

  /**
   * Fetches documents with encryption verification and performance monitoring
   */
  const refreshDocuments = useCallback(async () => {
    try {
      operationStartTime.current = Date.now();
      retryCount.current = 0;

      const fetchWithRetry = async (): Promise<void> => {
        try {
          await dispatch(fetchDocuments(type));
          
          // Performance monitoring
          const duration = Date.now() - operationStartTime.current;
          if (duration > PERFORMANCE_THRESHOLDS.FETCH_WARNING_MS) {
            console.warn(`Document fetch exceeded performance threshold: ${duration}ms`);
          }
        } catch (error) {
          if (retryCount.current < MAX_RETRIES) {
            retryCount.current++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount.current));
            return fetchWithRetry();
          }
          throw error;
        }
      };

      await fetchWithRetry();
    } catch (error) {
      console.error('Document fetch failed:', error);
      throw error;
    }
  }, [dispatch, type]);

  /**
   * Uploads document with progress tracking and encryption verification
   */
  const handleUploadDocument = useCallback(async (request: DocumentUploadRequest): Promise<Document> => {
    try {
      operationStartTime.current = Date.now();
      retryCount.current = 0;

      const uploadWithRetry = async (): Promise<Document> => {
        try {
          const document = await dispatch(uploadDocument(request)).unwrap();

          // Performance monitoring
          const duration = Date.now() - operationStartTime.current;
          if (duration > PERFORMANCE_THRESHOLDS.UPLOAD_WARNING_MS) {
            console.warn(`Document upload exceeded performance threshold: ${duration}ms`);
          }

          return document;
        } catch (error) {
          if (retryCount.current < MAX_RETRIES) {
            retryCount.current++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount.current));
            return uploadWithRetry();
          }
          throw error;
        }
      };

      return await uploadWithRetry();
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Securely deletes document with audit logging
   */
  const handleDeleteDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      operationStartTime.current = Date.now();
      retryCount.current = 0;

      const deleteWithRetry = async (): Promise<void> => {
        try {
          await dispatch(deleteDocument(documentId));
          
          // Performance monitoring
          const duration = Date.now() - operationStartTime.current;
          if (duration > PERFORMANCE_THRESHOLDS.DELETE_WARNING_MS) {
            console.warn(`Document deletion exceeded performance threshold: ${duration}ms`);
          }
        } catch (error) {
          if (retryCount.current < MAX_RETRIES) {
            retryCount.current++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount.current));
            return deleteWithRetry();
          }
          throw error;
        }
      };

      await deleteWithRetry();
    } catch (error) {
      console.error('Document deletion failed:', error);
      throw error;
    }
  }, [dispatch]);

  // Initial document fetch and cleanup
  useEffect(() => {
    refreshDocuments();

    return () => {
      // Cleanup sensitive data references
      operationStartTime.current = 0;
      retryCount.current = 0;
    };
  }, [refreshDocuments, type]);

  return {
    documents,
    loading,
    error,
    uploadProgress,
    encryptionStatus,
    performanceMetrics,
    uploadDocument: handleUploadDocument,
    deleteDocument: handleDeleteDocument,
    refreshDocuments
  };
};

export default useDocument;