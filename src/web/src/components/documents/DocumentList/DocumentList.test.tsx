// @testing-library/react version ^13.0.0
// jest version ^29.0.0
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DocumentList from './DocumentList';
import { mockApiRequest } from '../../utils/test.util';
import { DocumentTypes } from '../../../types/document.types';

/**
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and rendering of the DocumentList component.
 */

// Mock the useDocument hook
jest.mock('../../../hooks/useDocument', () => ({
  __esModule: true,
  default: () => ({
    documents: mockDocuments,
    loading: false,
    error: null,
    formatDates: (doc: DocumentTypes) => ({
      createdAt: new Date(doc.createdAt).toLocaleDateString(),
      updatedAt: new Date(doc.updatedAt).toLocaleDateString()
    })
  })
}));

// Mock document data
const mockDocuments: DocumentTypes[] = [
  {
    documentId: '1',
    title: 'Test Document 1',
    category: 'legal',
    status: 'approved',
    metadata: {
      version: '1.0',
      size: 1024,
      mimeType: 'application/pdf',
      originalName: 'test1.pdf'
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  },
  {
    documentId: '2',
    title: 'Test Document 2',
    category: 'financial',
    status: 'pending_review',
    metadata: {
      version: '1.0',
      size: 2048,
      mimeType: 'application/pdf',
      originalName: 'test2.pdf'
    },
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-02')
  }
];

describe('DocumentList Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test: Document List Rendering
   * Validates that the DocumentList component renders correctly with mock data
   */
  test('renders document list with correct data', async () => {
    // Mock API request
    mockApiRequest({
      url: '/documents',
      method: 'GET',
      data: mockDocuments
    });

    // Render component
    render(<DocumentList />);

    // Assert table headers are rendered
    expect(screen.getByText('Document Title')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created Date')).toBeInTheDocument();
    expect(screen.getByText('Last Modified')).toBeInTheDocument();

    // Assert document data is rendered
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
      expect(screen.getByText('Test Document 2')).toBeInTheDocument();
      expect(screen.getByText('legal')).toBeInTheDocument();
      expect(screen.getByText('financial')).toBeInTheDocument();
    });
  });

  /**
   * Test: Document List Sorting
   * Validates the sorting functionality of the document list
   */
  test('sorts documents when clicking column headers', async () => {
    // Mock API request
    mockApiRequest({
      url: '/documents',
      method: 'GET',
      data: mockDocuments
    });

    // Render component
    render(<DocumentList />);

    // Get title column header
    const titleHeader = screen.getByText('Document Title');

    // Click title header to sort
    fireEvent.click(titleHeader);

    // Assert documents are sorted alphabetically
    await waitFor(() => {
      const titles = screen.getAllByRole('cell')
        .filter(cell => cell.textContent?.includes('Test Document'))
        .map(cell => cell.textContent);
      
      expect(titles).toEqual(['Test Document 1', 'Test Document 2']);
    });

    // Click again to reverse sort
    fireEvent.click(titleHeader);

    // Assert documents are sorted in reverse
    await waitFor(() => {
      const titles = screen.getAllByRole('cell')
        .filter(cell => cell.textContent?.includes('Test Document'))
        .map(cell => cell.textContent);
      
      expect(titles).toEqual(['Test Document 2', 'Test Document 1']);
    });
  });

  /**
   * Test: Document List Error Handling
   * Validates error handling when API request fails
   */
  test('displays error message when API request fails', async () => {
    // Mock failed API request
    const errorMessage = 'Failed to fetch documents';
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error

    // Mock useDocument hook with error state
    jest.mock('../../../hooks/useDocument', () => ({
      __esModule: true,
      default: () => ({
        documents: [],
        loading: false,
        error: new Error(errorMessage),
        formatDates: jest.fn()
      })
    }));

    // Render component
    render(<DocumentList />);

    // Assert error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  /**
   * Test: Loading State
   * Validates loading state display
   */
  test('displays loading state while fetching documents', async () => {
    // Mock useDocument hook with loading state
    jest.mock('../../../hooks/useDocument', () => ({
      __esModule: true,
      default: () => ({
        documents: [],
        loading: true,
        error: null,
        formatDates: jest.fn()
      })
    }));

    // Render component
    render(<DocumentList />);

    // Assert loading indicator is displayed
    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  /**
   * Test: Empty State
   * Validates empty state display when no documents are available
   */
  test('displays empty state when no documents are available', async () => {
    // Mock useDocument hook with empty documents array
    jest.mock('../../../hooks/useDocument', () => ({
      __esModule: true,
      default: () => ({
        documents: [],
        loading: false,
        error: null,
        formatDates: jest.fn()
      })
    }));

    // Render component
    render(<DocumentList />);

    // Assert empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText('No Documents Found')).toBeInTheDocument();
      expect(screen.getByText('There are currently no documents to display.')).toBeInTheDocument();
    });
  });
});