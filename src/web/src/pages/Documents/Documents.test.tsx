/**
 * Estate Kit - Documents Page Tests
 * 
 * Requirements addressed:
 * - Document Management Testing (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Validates the functionality of document-related features, including listing, uploading, and updating documents.
 * - Frontend Testing Standards (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Ensures the Documents page adheres to the defined testing standards, including unit and integration tests.
 * 
 * Human Tasks:
 * 1. Verify test coverage meets project requirements
 * 2. Test document upload functionality with various file types
 * 3. Validate error handling scenarios
 * 4. Review loading state behavior with QA team
 */

// React Testing Library v13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Jest v29.0.0
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Component imports
import DocumentsPage from './Documents';
import DocumentList from '../../components/documents/DocumentList/DocumentList';
import DocumentUpload from '../../components/documents/DocumentUpload/DocumentUpload';
import { documentSlice } from '../../redux/slices/documentSlice';

// Mock imports
import { mockApiRequest } from '../../utils/test.util';
import { validateDocument } from '../../utils/validation.util';

// Mock the document service
jest.mock('../../services/document.service', () => ({
  fetchDocuments: jest.fn(),
  uploadDocument: jest.fn(),
  updateDocument: jest.fn()
}));

// Mock useDocument hook
jest.mock('../../hooks/useDocument', () => ({
  useDocument: () => ({
    documents: mockDocuments,
    loading: false,
    error: null,
    fetchAllDocuments: jest.fn(),
    uploadNewDocument: jest.fn(),
    updateExistingDocument: jest.fn(),
    formatDates: jest.fn()
  })
}));

// Test data
const mockDocuments = [
  {
    documentId: '1',
    title: 'Test Document 1',
    category: 'LEGAL',
    status: 'active',
    metadata: {
      size: 1024,
      type: 'application/pdf'
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    documentId: '2',
    title: 'Test Document 2',
    category: 'PERSONAL',
    status: 'pending',
    metadata: {
      size: 2048,
      type: 'image/jpeg'
    },
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  }
];

// Setup test store
const setupStore = () => {
  return configureStore({
    reducer: {
      document: documentSlice.reducer
    },
    preloadedState: {
      document: {
        documents: mockDocuments,
        loading: false,
        error: null
      }
    }
  });
};

describe('DocumentsPage', () => {
  let store: ReturnType<typeof setupStore>;

  beforeEach(() => {
    store = setupStore();
  });

  test('renders Documents page with all components', async () => {
    render(
      <Provider store={store}>
        <DocumentsPage />
      </Provider>
    );

    // Verify page title is rendered
    expect(screen.getByText('Documents')).toBeInTheDocument();

    // Verify upload section is rendered
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(screen.getByLabelText('Document Upload Section')).toBeInTheDocument();

    // Verify document list section is rendered
    expect(screen.getByText('Your Documents')).toBeInTheDocument();
    expect(screen.getByLabelText('Document List Section')).toBeInTheDocument();
  });

  test('displays loading state correctly', async () => {
    const store = configureStore({
      reducer: {
        document: documentSlice.reducer
      },
      preloadedState: {
        document: {
          documents: [],
          loading: true,
          error: null
        }
      }
    });

    render(
      <Provider store={store}>
        <DocumentsPage />
      </Provider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays error state correctly', async () => {
    const errorMessage = 'Failed to load documents';
    const store = configureStore({
      reducer: {
        document: documentSlice.reducer
      },
      preloadedState: {
        document: {
          documents: [],
          loading: false,
          error: errorMessage
        }
      }
    });

    render(
      <Provider store={store}>
        <DocumentsPage />
      </Provider>
    );

    expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('handles document upload successfully', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const mockUploadResponse = {
      documentId: '3',
      title: 'test.pdf',
      category: 'LEGAL',
      status: 'pending',
      metadata: {
        size: 1024,
        type: 'application/pdf'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock the upload service
    const uploadDocument = require('../../services/document.service').uploadDocument;
    uploadDocument.mockResolvedValueOnce(mockUploadResponse);

    render(
      <Provider store={store}>
        <DocumentsPage />
      </Provider>
    );

    // Simulate file upload
    const uploadInput = screen.getByLabelText('Upload files by clicking or dragging and dropping');
    fireEvent.drop(uploadInput, {
      dataTransfer: {
        files: [file]
      }
    });

    // Verify upload was successful
    await waitFor(() => {
      expect(uploadDocument).toHaveBeenCalledWith(expect.any(FormData));
      expect(store.getState().document.documents).toHaveLength(mockDocuments.length + 1);
    });
  });

  test('validates documents correctly', () => {
    mockDocuments.forEach(document => {
      expect(validateDocument(document)).toBe(true);
    });

    // Test invalid document
    const invalidDocument = {
      documentId: '3',
      // Missing required fields
      status: 'active'
    };
    expect(validateDocument(invalidDocument)).toBe(false);
  });

  test('handles document list sorting', async () => {
    render(
      <Provider store={store}>
        <DocumentsPage />
      </Provider>
    );

    // Get sort buttons
    const titleSort = screen.getByText('Document Title');
    const dateSort = screen.getByText('Created Date');

    // Test title sorting
    fireEvent.click(titleSort);
    let documents = screen.getAllByRole('row');
    expect(documents[1]).toHaveTextContent('Test Document 1');

    // Test date sorting
    fireEvent.click(dateSort);
    documents = screen.getAllByRole('row');
    expect(documents[1]).toHaveTextContent(mockDocuments[0].createdAt.toLocaleString());
  });
});