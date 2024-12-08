// @package jest v29.0.0
// @package aws-sdk-mock v5.8.0

import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument 
} from '../../services/document.service';
import { generatePDF, storePDF } from '../../utils/pdf.util';
import { encryptData } from '../../utils/encryption.util';
import { initializeS3 } from '../../config/aws';
import { DocumentModel } from '../../db/models/document.model';
import { DocumentStatus, DocumentCategory } from '../../types/document.types';
import AWSMock from 'aws-sdk-mock';

/**
 * Human Tasks:
 * 1. Ensure test environment variables are properly configured
 * 2. Verify that mock AWS credentials are set up for testing
 * 3. Configure test database with appropriate permissions
 * 4. Set up test encryption keys and certificates
 */

// Mock dependencies
jest.mock('../../utils/pdf.util');
jest.mock('../../utils/encryption.util');
jest.mock('../../db/models/document.model');
jest.mock('../../config/aws');

describe('Document Service Tests', () => {
  // Test data
  const mockDocumentData = {
    documentId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Document',
    category: DocumentCategory.LEGAL,
    status: DocumentStatus.DRAFT,
    metadata: {
      generatePdf: true,
      version: '1.0',
      size: 1024,
      mimeType: 'application/pdf'
    }
  };

  const mockPdfBuffer = Buffer.from('mock-pdf-content');
  const mockPdfUrl = 'https://s3.example.com/documents/test.pdf';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    AWSMock.restore();
  });

  /**
   * Test: Document Creation
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - PDF Generation and Formatting (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   */
  describe('createDocument', () => {
    it('should create a document with PDF generation', async () => {
      // Mock document creation
      (DocumentModel.create as jest.Mock).mockResolvedValue({
        ...mockDocumentData,
        update: jest.fn()
      });

      // Mock PDF generation and storage
      (generatePDF as jest.Mock).mockResolvedValue(mockPdfBuffer);
      (storePDF as jest.Mock).mockResolvedValue(mockPdfUrl);

      const result = await createDocument(mockDocumentData);

      // Verify document creation
      expect(DocumentModel.create).toHaveBeenCalledWith(mockDocumentData);
      
      // Verify PDF generation
      expect(generatePDF).toHaveBeenCalledWith(mockDocumentData);
      
      // Verify PDF storage
      expect(storePDF).toHaveBeenCalledWith(mockPdfBuffer, mockDocumentData.documentId);
      
      // Verify document update with PDF URL
      expect(result.update).toHaveBeenCalledWith({
        metadata: {
          ...mockDocumentData.metadata,
          pdfUrl: mockPdfUrl
        }
      });
    });

    it('should handle document creation failure', async () => {
      (DocumentModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(createDocument(mockDocumentData))
        .rejects
        .toThrow('Failed to create document: Database error');
    });
  });

  /**
   * Test: Document Retrieval
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
   */
  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const mockDocument = {
        ...mockDocumentData,
        metadata: {
          ...mockDocumentData.metadata,
          pdfUrl: mockPdfUrl
        }
      };

      (DocumentModel.findByPk as jest.Mock).mockResolvedValue(mockDocument);

      const result = await getDocument(mockDocumentData.documentId);

      expect(DocumentModel.findByPk).toHaveBeenCalledWith(mockDocumentData.documentId);
      expect(result).toEqual(mockDocument);
    });

    it('should handle non-existent document', async () => {
      (DocumentModel.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(getDocument(mockDocumentData.documentId))
        .rejects
        .toThrow(`Document not found with ID: ${mockDocumentData.documentId}`);
    });
  });

  /**
   * Test: Document Update
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
   */
  describe('updateDocument', () => {
    const updateData = {
      title: 'Updated Document',
      metadata: {
        regeneratePdf: true
      }
    };

    it('should update a document and regenerate PDF', async () => {
      const mockDocument = {
        ...mockDocumentData,
        update: jest.fn(),
        toJSON: jest.fn().mockReturnValue(mockDocumentData)
      };

      (DocumentModel.findByPk as jest.Mock).mockResolvedValue(mockDocument);
      (generatePDF as jest.Mock).mockResolvedValue(mockPdfBuffer);
      (storePDF as jest.Mock).mockResolvedValue(mockPdfUrl);

      const result = await updateDocument(mockDocumentData.documentId, updateData);

      expect(DocumentModel.findByPk).toHaveBeenCalledWith(mockDocumentData.documentId);
      expect(mockDocument.update).toHaveBeenCalledWith(updateData);
      expect(generatePDF).toHaveBeenCalled();
      expect(storePDF).toHaveBeenCalledWith(mockPdfBuffer, mockDocumentData.documentId);
      expect(result).toBe(true);
    });

    it('should handle document update failure', async () => {
      (DocumentModel.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(updateDocument(mockDocumentData.documentId, updateData))
        .rejects
        .toThrow(`Document not found with ID: ${mockDocumentData.documentId}`);
    });
  });

  /**
   * Test: Document Deletion
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - Document Storage (Technical Specifications/2.2 Container Architecture/Backend Services)
   */
  describe('deleteDocument', () => {
    it('should delete a document and its PDF', async () => {
      const mockDocument = {
        ...mockDocumentData,
        metadata: {
          ...mockDocumentData.metadata,
          pdfUrl: mockPdfUrl
        },
        destroy: jest.fn()
      };

      (DocumentModel.findByPk as jest.Mock).mockResolvedValue(mockDocument);
      AWSMock.mock('S3', 'deleteObject', (params: any, callback: Function) => {
        callback(null, { success: true });
      });

      const result = await deleteDocument(mockDocumentData.documentId);

      expect(DocumentModel.findByPk).toHaveBeenCalledWith(mockDocumentData.documentId);
      expect(mockDocument.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle document deletion failure', async () => {
      (DocumentModel.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(deleteDocument(mockDocumentData.documentId))
        .rejects
        .toThrow(`Document not found with ID: ${mockDocumentData.documentId}`);
    });
  });
});