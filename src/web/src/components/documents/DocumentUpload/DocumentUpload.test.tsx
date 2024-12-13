/**
 * @fileoverview Test suite for DocumentUpload component
 * Implements comprehensive testing for document upload functionality,
 * accessibility compliance, and security validations.
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { DocumentUpload, DocumentUploadProps } from './DocumentUpload';
import { DocumentType } from '../../../types/document.types';
import { renderWithProviders } from '../../../utils/test.util';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock file data
const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
const mockLargeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
const mockInvalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });

// Default props for testing
const defaultProps: DocumentUploadProps = {
  onUploadComplete: vi.fn(),
  onUploadError: vi.fn(),
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  retryAttempts: 3
};

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 Level AA standards', async () => {
      const { container } = renderWithProviders(<DocumentUpload {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      const documentTypeSelect = screen.getByLabelText(/document type/i);
      const uploadArea = screen.getByRole('button', { name: /upload document/i });

      // Test keyboard focus order
      await userEvent.tab();
      expect(documentTypeSelect).toHaveFocus();
      
      await userEvent.tab();
      expect(uploadArea).toHaveFocus();
    });

    it('should provide appropriate ARIA labels and announcements', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      // Check for ARIA labels
      expect(screen.getByRole('region', { name: /document upload/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /document type/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload document/i })).toHaveAttribute('aria-describedby');
    });
  });

  describe('Document Type Selection', () => {
    it('should display all available document types', () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      const select = screen.getByLabelText(/document type/i);
      userEvent.click(select);
      
      expect(screen.getByText('Medical Records')).toBeInTheDocument();
      expect(screen.getByText('Financial Documents')).toBeInTheDocument();
      expect(screen.getByText('Legal Documents')).toBeInTheDocument();
      expect(screen.getByText('Personal Documents')).toBeInTheDocument();
    });

    it('should handle document type selection', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      const select = screen.getByLabelText(/document type/i);
      await userEvent.selectOptions(select, DocumentType.MEDICAL);
      
      expect(select).toHaveValue(DocumentType.MEDICAL);
      expect(screen.getByRole('status')).toHaveTextContent(/selected document type: medical/i);
    });
  });

  describe('File Upload Functionality', () => {
    it('should handle valid file upload', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      // Select document type
      await userEvent.selectOptions(
        screen.getByLabelText(/document type/i),
        DocumentType.MEDICAL
      );

      // Upload file
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockFile);

      expect(defaultProps.onUploadComplete).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).toHaveTextContent(/uploaded successfully/i);
    });

    it('should enforce file size limits', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockLargeFile);

      expect(defaultProps.onUploadError).toHaveBeenCalledWith(
        expect.stringContaining('exceeds maximum allowed size')
      );
    });

    it('should validate file types', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockInvalidFile);

      expect(defaultProps.onUploadError).toHaveBeenCalledWith(
        expect.stringContaining('File type not supported')
      );
    });

    it('should display upload progress', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      // Select document type and upload file
      await userEvent.selectOptions(
        screen.getByLabelText(/document type/i),
        DocumentType.MEDICAL
      );
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockFile);

      // Check progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display validation errors', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockFile);

      expect(screen.getByText(/please select a document type/i)).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      // Mock network failure
      const mockError = new Error('Network error');
      defaultProps.onUploadComplete.mockRejectedValueOnce(mockError);

      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      await userEvent.selectOptions(
        screen.getByLabelText(/document type/i),
        DocumentType.MEDICAL
      );
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockFile);

      expect(screen.getByRole('alert')).toHaveTextContent(/upload failed/i);
    });

    it('should implement retry mechanism', async () => {
      const mockError = new Error('Temporary error');
      defaultProps.onUploadComplete
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ id: '123', name: 'test.pdf' });

      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      await userEvent.selectOptions(
        screen.getByLabelText(/document type/i),
        DocumentType.MEDICAL
      );
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockFile);

      await waitFor(() => {
        expect(defaultProps.onUploadComplete).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Security Validations', () => {
    it('should validate file integrity', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      await userEvent.selectOptions(
        screen.getByLabelText(/document type/i),
        DocumentType.MEDICAL
      );
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, mockFile);

      expect(defaultProps.onUploadComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            checksumSHA256: expect.any(String)
          })
        })
      );
    });

    it('should enforce document type restrictions', async () => {
      renderWithProviders(<DocumentUpload {...defaultProps} />);
      
      await userEvent.selectOptions(
        screen.getByLabelText(/document type/i),
        DocumentType.MEDICAL
      );
      
      const input = screen.getByLabelText(/choose files/i);
      await userEvent.upload(input, new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

      expect(defaultProps.onUploadError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid file type for medical documents')
      );
    });
  });
});