/**
 * Estate Kit - Document Redux Slice
 * 
 * Requirements addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements state management for document-related operations, including fetching, uploading, and updating document data.
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Centralizes document-related state management using Redux Toolkit.
 * 
 * Human Tasks:
 * 1. Verify error handling strategies align with UX requirements
 * 2. Test document state updates with large datasets
 * 3. Review loading state indicators with UI/UX team
 */

// @reduxjs/toolkit version ^1.9.5
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DocumentTypes } from '../../types/document.types';
import { 
  fetchDocuments as fetchDocumentsService,
  uploadDocument as uploadDocumentService,
  updateDocument as updateDocumentService
} from '../../services/document.service';

// Define the state interface for the document slice
interface DocumentState {
  documents: Array<DocumentTypes>;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DocumentState = {
  documents: [],
  loading: false,
  error: null
};

// Async thunk for fetching documents
export const fetchDocuments = createAsyncThunk(
  'document/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const documents = await fetchDocumentsService();
      return documents;
    } catch (error) {
      return rejectWithValue('Failed to fetch documents');
    }
  }
);

// Async thunk for uploading a document
export const uploadDocument = createAsyncThunk(
  'document/uploadDocument',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const document = await uploadDocumentService(formData);
      return document;
    } catch (error) {
      return rejectWithValue('Failed to upload document');
    }
  }
);

// Async thunk for updating a document
export const updateDocument = createAsyncThunk(
  'document/updateDocument',
  async (document: DocumentTypes, { rejectWithValue }) => {
    try {
      const updatedDocument = await updateDocumentService(document);
      return updatedDocument;
    } catch (error) {
      return rejectWithValue('Failed to update document');
    }
  }
);

// Create the document slice
const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Handle fetchDocuments
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle uploadDocument
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = [...state.documents, action.payload];
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle updateDocument
    builder
      .addCase(updateDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = state.documents.map(doc => 
          doc.documentId === action.payload.documentId ? action.payload : doc
        );
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions and reducer
export const { setLoading, setError } = documentSlice.actions;
export default documentSlice.reducer;