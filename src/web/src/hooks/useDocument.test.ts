/**
 * Test Suite for useDocument Hook
 * Version: 1.0.0
 * 
 * Comprehensive tests for document management operations with security compliance,
 * encryption monitoring, and performance tracking.
 * 
 * @package @testing-library/react-hooks ^8.0.1
 * @package @jest/globals ^29.0.0
 */

import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import { renderWithProviders, createMockStore } from '../utils/test.util';
import { useDocument } from './useDocument';
import {
  Document,
  DocumentType,
  DocumentStatus,
  EncryptionStatus,
  DocumentUploadRequest
} from '../types/document.types';

// Mock performance measurement
jest.spyOn(performance, 'now').mockImplementation(() => Date.now());

// Mock document data
const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: 'doc-123',
  userId: 'user-123',
  title: 'Test Document',
  type: DocumentType.LEGAL,
  status: DocumentStatus.COMPLETED,
  metadata: {
    fileName: 'test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    uploadedAt: new Date(),
    lastModified: new Date(),
    encryptionStatus: true,
    checksumSHA256: 'abc123',
    storageLocation: 's3://bucket/test.pdf',
    retentionPeriod: 365
  },
  accessControl: {
    delegateIds: [],
    accessLevel: 'READ',
    expiresAt: null,
    lastAccessedBy: 'user-123',
    lastAccessedAt: new Date()
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1,
  ...overrides
});

// Mock initial state
const mockInitialState = {
  documents: {
    items: [createMockDocument()],
    loading: false,
    error: null,
    uploadProgress: {},
    encryptionStatus: { 'doc-123': true },
    performanceMetrics: {},
    securityAuditLog: []
  }
};

describe('useDocument Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Document Fetching', () => {
    it('should fetch documents with encryption verification', async () => {
      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockInitialState
        })
      });

      await waitFor(() => {
        expect(result.current.documents).toHaveLength(1);
        expect(result.current.encryptionStatus['doc-123']).toBe(true);
      });
    });

    it('should handle fetch errors with security logging', async () => {
      const mockError = 'Security verification failed';
      const mockState = {
        documents: {
          ...mockInitialState.documents,
          error: {
            code: 'SECURITY_ERROR',
            message: mockError,
            timestamp: new Date().toISOString()
          }
        }
      };

      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockState
        })
      });

      expect(result.current.error).toEqual(mockState.documents.error);
    });
  });

  describe('Document Upload', () => {
    it('should handle secure document upload with encryption', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const uploadRequest: DocumentUploadRequest = {
        title: 'Test Upload',
        type: DocumentType.LEGAL,
        file: mockFile,
        metadata: {
          fileName: 'test.pdf',
          fileSize: mockFile.size,
          mimeType: mockFile.type,
          checksumSHA256: 'test123'
        },
        accessControl: {
          delegateIds: [],
          accessLevel: 'READ',
          expiresAt: null
        }
      };

      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockInitialState
        })
      });

      await act(async () => {
        await result.current.uploadDocument(uploadRequest);
      });

      expect(result.current.uploadProgress).toBeDefined();
      expect(result.current.encryptionStatus).toBeDefined();
    });

    it('should monitor upload performance and encryption status', async () => {
      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockInitialState
        })
      });

      expect(result.current.performanceMetrics).toBeDefined();
      expect(Object.keys(result.current.encryptionStatus)).toContain('doc-123');
    });
  });

  describe('Document Deletion', () => {
    it('should handle secure document deletion with audit logging', async () => {
      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockInitialState
        })
      });

      await act(async () => {
        await result.current.deleteDocument('doc-123');
      });

      expect(result.current.documents).toHaveLength(0);
      expect(result.current.encryptionStatus['doc-123']).toBeUndefined();
    });

    it('should verify complete removal of sensitive data', async () => {
      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockInitialState
        })
      });

      await act(async () => {
        await result.current.deleteDocument('doc-123');
      });

      expect(result.current.documents.find(d => d.id === 'doc-123')).toBeUndefined();
      expect(result.current.uploadProgress['doc-123']).toBeUndefined();
      expect(result.current.encryptionStatus['doc-123']).toBeUndefined();
    });
  });

  describe('Security and Compliance', () => {
    it('should maintain encryption status throughout document lifecycle', async () => {
      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockInitialState
        })
      });

      expect(result.current.encryptionStatus['doc-123']).toBe(true);

      await act(async () => {
        await result.current.verifyDocumentEncryption('doc-123');
      });

      expect(result.current.encryptionStatus['doc-123']).toBe(true);
    });

    it('should handle security-related errors appropriately', async () => {
      const mockSecurityError = {
        code: 'ENCRYPTION_ERROR',
        message: 'Encryption verification failed',
        timestamp: new Date().toISOString()
      };

      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: {
            documents: {
              ...mockInitialState.documents,
              error: mockSecurityError
            }
          }
        })
      });

      expect(result.current.error).toEqual(mockSecurityError);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation performance metrics', async () => {
      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: mockInitialState
        })
      });

      await act(async () => {
        await result.current.refreshDocuments();
      });

      expect(result.current.performanceMetrics).toBeDefined();
      expect(Object.keys(result.current.performanceMetrics)).toContain('fetchDuration');
    });

    it('should handle retry attempts with performance tracking', async () => {
      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => renderWithProviders(children, {
          initialState: {
            documents: {
              ...mockInitialState.documents,
              error: {
                code: 'NETWORK_ERROR',
                message: 'Network failure',
                timestamp: new Date().toISOString()
              }
            }
          }
        })
      });

      await act(async () => {
        try {
          await result.current.refreshDocuments();
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.performanceMetrics).toBeDefined();
    });
  });
});