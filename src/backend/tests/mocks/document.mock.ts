/**
 * Estate Kit - Document Mocks
 * 
 * This file provides mock data for testing document-related functionalities.
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Ensures the testing of document management functionalities, including metadata, categories, and permissions.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Provides mock data to validate document structures and ensure compliance with defined types and interfaces.
 * 
 * Human Tasks:
 * 1. Verify that mock document categories align with business requirements
 * 2. Ensure mock metadata fields match the expected schema
 * 3. Review mock document statuses for testing coverage
 */

import { DocumentTypes, DocumentCategory, DocumentStatus } from '../types/document.types';
import { validateDocument } from '../utils/validation.util';

/**
 * Base mock document object implementing the DocumentTypes interface
 * Used for testing document-related functionality
 */
export const mockDocument: DocumentTypes = {
  documentId: 'mock-doc-123',
  title: 'Mock Document Title',
  category: DocumentCategory.LEGAL,
  status: DocumentStatus.ACTIVE,
  metadata: {
    version: '1.0',
    size: 1024,
    mimeType: 'application/pdf',
    originalName: 'original_document.pdf',
    key1: 'value1',
    key2: 'value2'
  },
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-02T00:00:00.000Z')
};

/**
 * Generates a mock document with customizable properties
 * @param overrides - Partial document properties to override default values
 * @returns A complete mock document object
 */
export const generateMockDocument = (overrides: Partial<DocumentTypes> = {}): DocumentTypes => {
  const mockData: DocumentTypes = {
    ...mockDocument,
    documentId: `mock-doc-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  // Validate the generated mock document
  if (!validateDocument(mockData)) {
    throw new Error('Generated mock document failed validation');
  }

  return mockData;
};

/**
 * Collection of mock documents with different statuses for testing
 */
export const mockDocuments: DocumentTypes[] = [
  generateMockDocument({
    status: DocumentStatus.DRAFT,
    category: DocumentCategory.MEDICAL
  }),
  generateMockDocument({
    status: DocumentStatus.PENDING_REVIEW,
    category: DocumentCategory.FINANCIAL
  }),
  generateMockDocument({
    status: DocumentStatus.APPROVED,
    category: DocumentCategory.PERSONAL
  }),
  generateMockDocument({
    status: DocumentStatus.ARCHIVED,
    category: DocumentCategory.LEGAL
  })
];

/**
 * Mock document with extensive metadata for testing metadata handling
 */
export const mockDocumentWithMetadata: DocumentTypes = generateMockDocument({
  metadata: {
    version: '2.0',
    size: 2048576, // 2MB
    mimeType: 'application/pdf',
    originalName: 'comprehensive_document.pdf',
    author: 'Test User',
    department: 'Legal',
    tags: ['important', 'confidential', 'legal'],
    lastReviewed: '2023-01-15T00:00:00.000Z',
    reviewedBy: 'mock-user-456',
    customField1: 'Custom Value 1',
    customField2: 'Custom Value 2',
    isEncrypted: true,
    encryptionType: 'AES-256',
    checksumMD5: 'd41d8cd98f00b204e9800998ecf8427e'
  }
});

/**
 * Mock invalid document for testing validation
 */
export const mockInvalidDocument = {
  documentId: 'invalid-doc',
  // Missing required fields to test validation
  category: 'invalid-category',
  status: 'invalid-status',
  metadata: 'invalid-metadata' // Should be an object
};