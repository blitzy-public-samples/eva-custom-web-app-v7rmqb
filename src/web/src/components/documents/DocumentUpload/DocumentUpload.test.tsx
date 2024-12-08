/**
 * Estate Kit - DocumentUpload Component Tests
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality of the DocumentUpload component.
 * 
 * Human Tasks:
 * 1. Verify test coverage meets project requirements
 * 2. Confirm mock API responses match production scenarios
 * 3. Test drag-and-drop functionality across different browsers
 */

// React Testing Library v13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Jest v29.0.0
import '@testing-library/jest-dom';
import React from 'react';

// Internal imports
import { DocumentUpload } from './DocumentUpload';
import { mockApiRequest, validateTestData } from '../../utils/test.util';
import { theme } from '../../config/theme.config';

// Mock the document service
jest.mock('../../services/document.service', () => ({
  uploadDocument: jest.fn()
}));

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('handleFileUpload', () => {
    it('should handle file upload successfully', async () => {
      // Mock successful API response
      const mockResponse = {
        documentId: '123',
        title: 'test-document.pdf',
        category: 'LEGAL',
        status: 'pending',
        metadata: {
          size: 1024,
          type: 'application/pdf',
          lastModified: new Date()
        }
      };

      mockApiRequest({
        url: '/documents',
        method: 'POST',
        data: mockResponse,
        status: 200
      });

      render(<DocumentUpload />);

      // Create a mock file
      const file = new File(['test content'], 'test-document.pdf', {
        type: 'application/pdf'
      });

      // Trigger file upload
      const input = screen.getByRole('button', {
        name: /upload files by clicking or dragging and dropping/i
      });

      const dataTransfer = {
        files: [file],
        types: ['Files']
      };

      fireEvent.drop(input, { dataTransfer });

      // Verify loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });

      // Verify uploaded file is displayed
      expect(screen.getByText(/1.0KB/)).toBeInTheDocument();
    });

    it('should handle file upload errors', async () => {
      // Mock API error response
      mockApiRequest({
        url: '/documents',
        method: 'POST',
        status: 400,
        data: { message: 'Invalid file type' }
      });

      render(<DocumentUpload />);

      // Create an invalid file
      const file = new File(['test content'], 'test.exe', {
        type: 'application/x-msdownload'
      });

      // Trigger file upload
      const input = screen.getByRole('button', {
        name: /upload files by clicking or dragging and dropping/i
      });

      const dataTransfer = {
        files: [file],
        types: ['Files']
      };

      fireEvent.drop(input, { dataTransfer });

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/File type application\/x-msdownload not supported/i)).toBeInTheDocument();
      });
    });

    it('should enforce maximum file size limit', async () => {
      render(<DocumentUpload maxFileSize={1024} />); // 1KB limit

      // Create a file larger than the limit
      const largeFile = new File(['x'.repeat(2048)], 'large-file.pdf', {
        type: 'application/pdf'
      });

      // Trigger file upload
      const input = screen.getByRole('button', {
        name: /upload files by clicking or dragging and dropping/i
      });

      const dataTransfer = {
        files: [largeFile],
        types: ['Files']
      };

      fireEvent.drop(input, { dataTransfer });

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });
    });
  });

  describe('renderDragAndDropArea', () => {
    it('should render drag and drop area with correct styles', () => {
      render(<DocumentUpload />);

      const dropArea = screen.getByRole('button', {
        name: /upload files by clicking or dragging and dropping/i
      });

      // Verify initial styles
      expect(dropArea).toHaveStyle({
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius
      });

      // Simulate drag enter
      fireEvent.dragEnter(dropArea);

      // Verify drag-over styles
      expect(dropArea).toHaveStyle({
        backgroundColor: theme.palette.primary.light,
        border: `2px dashed ${theme.palette.primary.main}`
      });

      // Simulate drag leave
      fireEvent.dragLeave(dropArea);

      // Verify styles return to normal
      expect(dropArea).toHaveStyle({
        backgroundColor: theme.palette.background.paper
      });
    });

    it('should display supported file types and size limit', () => {
      render(<DocumentUpload maxFileSize={5242880} />); // 5MB

      // Verify file type information
      expect(screen.getByText(/Supported formats: PDF, DOCX, JPG, PNG/i)).toBeInTheDocument();

      // Verify size limit information
      expect(screen.getByText(/Maximum file size: 5MB/i)).toBeInTheDocument();
    });

    it('should handle multiple file uploads', async () => {
      // Mock successful API responses
      const mockResponses = [
        {
          documentId: '123',
          title: 'document1.pdf',
          category: 'LEGAL',
          status: 'pending'
        },
        {
          documentId: '124',
          title: 'document2.jpg',
          category: 'PERSONAL',
          status: 'pending'
        }
      ];

      mockApiRequest({
        url: '/documents',
        method: 'POST',
        data: mockResponses,
        status: 200
      });

      render(<DocumentUpload maxFiles={2} />);

      // Create mock files
      const files = [
        new File(['content1'], 'document1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'document2.jpg', { type: 'image/jpeg' })
      ];

      // Trigger file upload
      const input = screen.getByRole('button', {
        name: /upload files by clicking or dragging and dropping/i
      });

      const dataTransfer = {
        files,
        types: ['Files']
      };

      fireEvent.drop(input, { dataTransfer });

      // Verify both files are displayed
      await waitFor(() => {
        expect(screen.getByText('document1.pdf')).toBeInTheDocument();
        expect(screen.getByText('document2.jpg')).toBeInTheDocument();
      });
    });
  });
});