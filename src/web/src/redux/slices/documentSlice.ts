/**
 * Document Management Redux Slice
 * Version: 1.0.0
 * 
 * Implements secure document state management with PIPEDA compliance,
 * encryption monitoring, and comprehensive performance tracking.
 * 
 * @package @reduxjs/toolkit ^1.9.0
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentUploadRequest
} from '../../types/document.types';
import DocumentService from '../../services/document.service';

// Types for enhanced state management
interface PIPEDACompliantError {
  code: string;
  message: string;
  timestamp: string;
  correlationId?: string;
}

interface AuditLogEntry {
  action: string;
  timestamp: string;
  documentId?: string;
  userId?: string;
  details: Record<string, any>;
}

// Initial state with comprehensive tracking
interface DocumentState {
  items: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  error: PIPEDACompliantError | null;
  uploadProgress: Record<string, number>;
  uploadStatus: Record<string, DocumentStatus>;
  encryptionStatus: Record<string, boolean>;
  performanceMetrics: Record<string, number>;
  securityAuditLog: AuditLogEntry[];
}

const initialState: DocumentState = {
  items: [],
  selectedDocument: null,
  loading: false,
  error: null,
  uploadProgress: {},
  uploadStatus: {},
  encryptionStatus: {},
  performanceMetrics: {},
  securityAuditLog: []
};

// Async thunks with enhanced security and monitoring
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async ({ rejectWithValue, type }: { rejectWithValue: any; type?: DocumentType }) => {
    try {
      const startTime = Date.now();
      const documentService = new DocumentService();
      const documents = await documentService.listDocuments(type);
      
      // Verify encryption status for each document
      const documentsWithEncryption = await Promise.all(
        documents.map(async (doc: Document) => {
          const isEncrypted = await documentService.verifyEncryption(doc.id);
          return { ...doc, encryptionVerified: isEncrypted };
        })
      );

      // Record performance metrics
      const duration = Date.now() - startTime;
      return {
        documents: documentsWithEncryption,
        metrics: { fetchDuration: duration }
      };
    } catch (error: any) {
      return rejectWithValue({
        code: error.code || 'FETCH_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async (request: DocumentUploadRequest, { dispatch, rejectWithValue }) => {
    try {
      const documentService = new DocumentService();
      const startTime = Date.now();

      // Initialize upload tracking
      const uploadId = `upload_${Date.now()}`;
      dispatch(documentSlice.actions.setUploadProgress({ id: uploadId, progress: 0 }));

      // Upload with progress monitoring
      const document = await documentService.uploadDocument(
        request,
        (progress: number) => {
          dispatch(documentSlice.actions.setUploadProgress({
            id: uploadId,
            progress
          }));
        }
      );

      // Monitor encryption status
      const encryptionStatus = await documentService.verifyEncryption(document.id);
      
      // Record performance metrics
      const duration = Date.now() - startTime;

      return {
        document,
        uploadId,
        encryptionStatus,
        metrics: { uploadDuration: duration }
      };
    } catch (error: any) {
      return rejectWithValue({
        code: error.code || 'UPLOAD_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId: string, { dispatch, rejectWithValue }) => {
    try {
      const documentService = new DocumentService();
      const startTime = Date.now();
      await documentService.secureDeleteDocument(documentId);

      // Record audit log
      dispatch(documentSlice.actions.logSecurityEvent({
        action: 'DOCUMENT_DELETE',
        documentId,
        timestamp: new Date().toISOString(),
        details: { success: true }
      }));

      return {
        documentId,
        metrics: { deleteDuration: Date.now() - startTime }
      };
    } catch (error: any) {
      return rejectWithValue({
        code: error.code || 'DELETE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Slice definition with comprehensive state management
const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setSelectedDocument: (state, action: PayloadAction<Document | null>) => {
      state.selectedDocument = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      state.uploadProgress[action.payload.id] = action.payload.progress;
    },
    updateEncryptionStatus: (state, action: PayloadAction<{ documentId: string; status: boolean }>) => {
      state.encryptionStatus[action.payload.documentId] = action.payload.status;
    },
    logSecurityEvent: (state, action: PayloadAction<AuditLogEntry>) => {
      state.securityAuditLog.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.documents;
        state.performanceMetrics = {
          ...state.performanceMetrics,
          ...action.payload.metrics
        };
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as PIPEDACompliantError;
      })
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.document);
        state.encryptionStatus[action.payload.document.id] = action.payload.encryptionStatus;
        state.performanceMetrics = {
          ...state.performanceMetrics,
          ...action.payload.metrics
        };
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as PIPEDACompliantError;
      })
      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(doc => doc.id !== action.payload.documentId);
        delete state.encryptionStatus[action.payload.documentId];
        state.performanceMetrics = {
          ...state.performanceMetrics,
          ...action.payload.metrics
        };
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as PIPEDACompliantError;
      });
  }
});

// Export actions and reducer
export const {
  setSelectedDocument,
  setUploadProgress,
  updateEncryptionStatus,
  logSecurityEvent,
  clearError,
  resetState
} = documentSlice.actions;

export default documentSlice.reducer;

// Selectors with memoization potential
export const selectDocuments = (state: { documents: DocumentState }) => state.documents.items;
export const selectSelectedDocument = (state: { documents: DocumentState }) => state.documents.selectedDocument;
export const selectDocumentLoading = (state: { documents: DocumentState }) => state.documents.loading;
export const selectDocumentError = (state: { documents: DocumentState }) => state.documents.error;
export const selectUploadProgress = (state: { documents: DocumentState }) => state.documents.uploadProgress;
export const selectEncryptionStatus = (state: { documents: DocumentState }) => state.documents.encryptionStatus;
export const selectPerformanceMetrics = (state: { documents: DocumentState }) => state.documents.performanceMetrics;
export const selectSecurityAuditLog = (state: { documents: DocumentState }) => state.documents.securityAuditLog;