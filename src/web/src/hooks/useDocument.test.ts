// jest version ^29.0.0
// @testing-library/react version ^13.0.0
import { renderHook, act } from '@testing-library/react';
import useDocument from './useDocument';
import { mockApiRequest } from '../utils/test.util';
import { DocumentTypes } from '../types/document.types';
import { fetchDocuments, uploadDocument, updateDocument } from '../services/document.service';

// Mock the document service functions
jest.mock('../services/document.service', () => ({
  fetchDocuments: jest.fn(),
  uploadDocument: jest.fn(),
  updateDocument: jest.fn()
}));

/**
 * Unit tests for the useDocument custom React hook
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality of the useDocument hook
 */

describe('useDocument Hook', () => {
  // Mock document data
  const mockDocuments: DocumentTypes[] = [
    {
      documentId: '1',
      title: 'Test Document 1',
      category: 'legal',
      status: 'draft',
      metadata: {
        version: '1.0',
        size: 1024,
        mimeType: 'application/pdf',
        originalName: 'test1.pdf'
      },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      documentId: '2',
      title: 'Test Document 2',
      category: 'financial',
      status: 'approved',
      metadata: {
        version: '1.0',
        size: 2048,
        mimeType: 'application/pdf',
        originalName: 'test2.pdf'
      },
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should fetch documents on initial mount', async () => {
    // Mock the fetchDocuments service function
    (fetchDocuments as jest.Mock).mockResolvedValueOnce(mockDocuments);

    // Render the hook
    const { result } = renderHook(() => useDocument());

    // Initial state should be empty
    expect(result.current.documents).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify the documents were fetched and state was updated
    expect(result.current.documents).toEqual(mockDocuments);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(fetchDocuments).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch documents error', async () => {
    // Mock the fetchDocuments service function to throw an error
    const error = new Error('Failed to fetch documents');
    (fetchDocuments as jest.Mock).mockRejectedValueOnce(error);

    // Render the hook
    const { result } = renderHook(() => useDocument());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify error state
    expect(result.current.documents).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(error);
  });

  it('should upload a new document', async () => {
    // Mock the uploadDocument service function
    const newDocument: DocumentTypes = {
      documentId: '3',
      title: 'New Document',
      category: 'medical',
      status: 'draft',
      metadata: {
        version: '1.0',
        size: 3072,
        mimeType: 'application/pdf',
        originalName: 'new.pdf'
      },
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03')
    };

    (uploadDocument as jest.Mock).mockResolvedValueOnce(newDocument);
    (fetchDocuments as jest.Mock).mockResolvedValueOnce(mockDocuments);

    // Render the hook
    const { result } = renderHook(() => useDocument());

    // Wait for initial fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Upload new document
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'application/pdf' }));
    formData.append('title', 'New Document');

    await act(async () => {
      await result.current.uploadNewDocument(formData);
    });

    // Verify document was uploaded and state was updated
    expect(uploadDocument).toHaveBeenCalledWith(formData);
    expect(result.current.documents).toContainEqual(newDocument);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should update an existing document', async () => {
    // Mock the updateDocument service function
    const updatedDocument: DocumentTypes = {
      ...mockDocuments[0],
      title: 'Updated Document',
      updatedAt: new Date('2023-01-04')
    };

    (updateDocument as jest.Mock).mockResolvedValueOnce(updatedDocument);
    (fetchDocuments as jest.Mock).mockResolvedValueOnce(mockDocuments);

    // Render the hook
    const { result } = renderHook(() => useDocument());

    // Wait for initial fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Update document
    await act(async () => {
      await result.current.updateExistingDocument(updatedDocument);
    });

    // Verify document was updated and state was updated
    expect(updateDocument).toHaveBeenCalledWith(updatedDocument);
    expect(result.current.documents).toContainEqual(updatedDocument);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should format document dates correctly', async () => {
    (fetchDocuments as jest.Mock).mockResolvedValueOnce(mockDocuments);

    // Render the hook
    const { result } = renderHook(() => useDocument());

    // Wait for initial fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Format dates for a document
    const formattedDates = result.current.formatDates(mockDocuments[0]);

    // Verify date formatting
    expect(formattedDates).toHaveProperty('createdAt');
    expect(formattedDates).toHaveProperty('updatedAt');
    expect(typeof formattedDates.createdAt).toBe('string');
    expect(typeof formattedDates.updatedAt).toBe('string');
  });

  it('should handle invalid document data', async () => {
    // Mock the fetchDocuments service function with invalid data
    const invalidDocument = {
      ...mockDocuments[0],
      documentId: undefined // Make the document invalid
    };
    (fetchDocuments as jest.Mock).mockResolvedValueOnce([invalidDocument]);

    // Render the hook
    const { result } = renderHook(() => useDocument());

    // Wait for the fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify error state
    expect(result.current.documents).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});