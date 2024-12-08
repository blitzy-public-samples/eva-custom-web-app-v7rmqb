// @testing-library/react version ^13.4.0
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// jest version ^29.0.0
import '@testing-library/jest-dom';
import { FileUpload } from './FileUpload';
import { mockApiRequest, validateTestData } from '../../utils/test.util';

/**
 * FileUpload Component Unit Tests
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality of the FileUpload component.
 */

// Mock the validation and format utilities
jest.mock('../../utils/validation.util', () => ({
  validateDocument: jest.fn().mockReturnValue(true)
}));

jest.mock('../../utils/format.util', () => ({
  formatDocumentTitle: jest.fn(title => title)
}));

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
global.crypto = {
  ...global.crypto,
  randomUUID: () => mockUUID
};

describe('FileUpload Component', () => {
  const defaultProps = {
    onUploadComplete: jest.fn(),
    maxFiles: 5,
    acceptedFileTypes: ['application/pdf', 'image/jpeg'],
    maxFileSize: 10 * 1024 * 1024 // 10MB
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders drag and drop area correctly', () => {
      render(<FileUpload {...defaultProps} />);
      
      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
      expect(screen.getByText(/supported formats/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('displays file input with correct accept attribute', () => {
      render(<FileUpload {...defaultProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', defaultProps.acceptedFileTypes.join(','));
    });
  });

  describe('File Upload Functionality', () => {
    test('handles file upload through input change', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file]
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(defaultProps.onUploadComplete).toHaveBeenCalledWith([expect.any(File)]);
      });
    });

    test('handles drag and drop file upload', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const dropArea = screen.getByRole('button');
      
      fireEvent.dragEnter(dropArea, {
        dataTransfer: {
          files: [file]
        }
      });
      
      expect(dropArea).toHaveStyle({
        backgroundColor: expect.any(String)
      });
      
      fireEvent.drop(dropArea, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(defaultProps.onUploadComplete).toHaveBeenCalledWith([expect.any(File)]);
      });
    });
  });

  describe('Validation', () => {
    test('validates file type', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile]
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText(/file type.*not supported/i)).toBeInTheDocument();
      });
    });

    test('validates file size', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile]
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });
    });

    test('validates maximum number of files', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const files = Array(6).fill(null).map((_, i) => 
        new File(['test content'], `test${i}.pdf`, { type: 'application/pdf' })
      );
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: files
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText(/maximum.*files allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when validation fails', async () => {
      const mockValidateDocument = require('../../utils/validation.util').validateDocument;
      mockValidateDocument.mockReturnValueOnce(false);
      
      render(<FileUpload {...defaultProps} />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file]
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid document structure/i)).toBeInTheDocument();
      });
    });

    test('handles upload errors gracefully', async () => {
      const mockError = new Error('Upload failed');
      defaultProps.onUploadComplete.mockRejectedValueOnce(mockError);
      
      render(<FileUpload {...defaultProps} />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file]
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
    });
  });
});