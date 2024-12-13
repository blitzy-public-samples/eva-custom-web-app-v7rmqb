import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals'; // ^29.0.0
import { Repository } from 'typeorm'; // ^0.3.0
import { mockDocument, mockDocumentList, createMockDocument } from '../../mocks/document.mock';
import { DocumentService } from '../../../src/services/document.service';
import { AuditService } from '../../../src/services/audit.service';
import { EncryptionService } from '../../../src/services/encryption.service';
import { StorageService } from '../../../src/services/storage.service';
import { 
  Document, 
  DocumentType, 
  DocumentStatus,
  CreateDocumentDTO 
} from '../../../src/types/document.types';
import { ResourceType, AccessLevel } from '../../../src/types/permission.types';

// Test constants
const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
const mockDocumentId = '123e4567-e89b-12d3-a456-426614174000';
const mockEncryptionKey = 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6';

// Mock services and repositories
const mockDocumentRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
  softDelete: jest.fn()
} as jest.Mocked<Repository<Document>>;

const mockStorageService = {
  uploadDocument: jest.fn(),
  getDocument: jest.fn(),
  deleteDocument: jest.fn(),
  applyRetentionPolicy: jest.fn(),
  createBackup: jest.fn()
} as jest.Mocked<any>;

const mockEncryptionService = {
  encryptData: jest.fn(),
  decryptData: jest.fn(),
  rotateKey: jest.fn(),
  generateKey: jest.fn(),
  validateKeyStrength: jest.fn()
} as jest.Mocked<any>;

const mockAuditService = {
  createAuditLog: jest.fn(),
  getAuditLogs: jest.fn(),
  logAccess: jest.fn(),
  logModification: jest.fn()
} as jest.Mocked<AuditService>;

/**
 * Creates a DocumentService instance with mocked dependencies
 */
const createMockDocumentService = () => {
  return new DocumentService(
    mockDocumentRepository,
    mockAuditService,
    mockEncryptionService,
    mockStorageService
  );
};

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    documentService = createMockDocumentService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createDocument', () => {
    const mockCreateDTO: CreateDocumentDTO = {
      title: 'Test Document',
      type: DocumentType.LEGAL,
      file: Buffer.from('test content'),
      metadata: {
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        retentionPeriod: 365,
        geographicLocation: 'ca-central-1'
      },
      retentionPeriod: 365
    };

    test('should create document with encrypted content and audit log', async () => {
      // Arrange
      const encryptedContent = {
        content: Buffer.from('encrypted'),
        keyId: mockEncryptionKey
      };
      mockEncryptionService.encryptData.mockResolvedValue(encryptedContent);
      mockStorageService.uploadDocument.mockResolvedValue({ version: '1' });
      mockDocumentRepository.save.mockResolvedValue(mockDocument);

      // Act
      const result = await documentService.createDocument(mockUserId, mockCreateDTO);

      // Assert
      expect(mockEncryptionService.encryptData).toHaveBeenCalledWith(
        mockCreateDTO.file,
        expect.any(Object)
      );
      expect(mockStorageService.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          content: encryptedContent.content,
          metadata: expect.any(Object)
        })
      );
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DOCUMENT_UPLOAD',
          userId: mockUserId,
          resourceType: ResourceType.LEGAL_DOCS
        })
      );
      expect(result).toBeDefined();
      expect(result.status).toBe(DocumentStatus.COMPLETED);
    });

    test('should enforce PIPEDA compliance metadata', async () => {
      // Arrange
      mockEncryptionService.encryptData.mockResolvedValue({
        content: Buffer.from('encrypted'),
        keyId: mockEncryptionKey
      });

      // Act
      const result = await documentService.createDocument(mockUserId, mockCreateDTO);

      // Assert
      expect(result.metadata).toEqual(
        expect.objectContaining({
          geographicLocation: 'ca-central-1',
          retentionPeriod: expect.any(Number)
        })
      );
      expect(result.storageDetails.encryptionType).toBeDefined();
      expect(result.storageDetails.kmsKeyId).toBeDefined();
    });

    test('should validate document retention policy', async () => {
      // Arrange
      const invalidDTO = { ...mockCreateDTO, retentionPeriod: 0 };

      // Act & Assert
      await expect(
        documentService.createDocument(mockUserId, invalidDTO)
      ).rejects.toThrow('Invalid retention period');
    });
  });

  describe('documentVersioning', () => {
    test('should create new version on update', async () => {
      // Arrange
      const updateData = {
        title: 'Updated Document',
        file: Buffer.from('updated content')
      };
      mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
      mockEncryptionService.encryptData.mockResolvedValue({
        content: Buffer.from('encrypted'),
        keyId: mockEncryptionKey
      });

      // Act
      const result = await documentService.updateDocument(
        mockUserId,
        mockDocumentId,
        updateData
      );

      // Assert
      expect(result.version).toBeDefined();
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DOCUMENT_UPDATE',
          details: expect.objectContaining({
            versionNumber: expect.any(Number)
          })
        })
      );
    });

    test('should maintain version history', async () => {
      // Arrange
      mockDocumentRepository.find.mockResolvedValue([
        { ...mockDocument, version: '1' },
        { ...mockDocument, version: '2' }
      ]);

      // Act
      const versions = await documentService.getDocumentVersions(mockDocumentId);

      // Assert
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBeDefined();
      expect(versions[1].version).toBeDefined();
    });
  });

  describe('securityControls', () => {
    test('should rotate encryption keys successfully', async () => {
      // Arrange
      mockEncryptionService.rotateKey.mockResolvedValue({
        newKeyId: 'new-key-id',
        metadata: { rotatedAt: new Date() }
      });
      mockDocumentRepository.findOne.mockResolvedValue(mockDocument);

      // Act
      const result = await documentService.rotateDocumentKey(mockDocumentId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'KEY_ROTATION',
          resourceId: mockDocumentId
        })
      );
    });

    test('should validate access permissions', async () => {
      // Arrange
      mockDocumentRepository.findOne.mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(
        documentService.verifyDocumentAccess(
          'unauthorized-user',
          mockDocumentId,
          AccessLevel.WRITE
        )
      ).rejects.toThrow('Insufficient permissions');
    });

    test('should maintain audit logs', async () => {
      // Arrange
      const mockAuditData = {
        documentId: mockDocumentId,
        startDate: new Date(),
        endDate: new Date()
      };

      // Act
      const auditLogs = await documentService.getDocumentAuditLog(mockAuditData);

      // Assert
      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: mockDocumentId
        })
      );
      expect(auditLogs).toBeDefined();
    });
  });

  describe('error handling', () => {
    test('should handle storage service errors', async () => {
      // Arrange
      mockStorageService.uploadDocument.mockRejectedValue(
        new Error('Storage service error')
      );

      // Act & Assert
      await expect(
        documentService.createDocument(mockUserId, mockCreateDTO)
      ).rejects.toThrow('Storage service error');
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DOCUMENT_UPLOAD_ERROR',
          severity: 'ERROR'
        })
      );
    });

    test('should handle encryption service errors', async () => {
      // Arrange
      mockEncryptionService.encryptData.mockRejectedValue(
        new Error('Encryption failed')
      );

      // Act & Assert
      await expect(
        documentService.createDocument(mockUserId, mockCreateDTO)
      ).rejects.toThrow('Encryption failed');
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ENCRYPTION_ERROR',
          severity: 'ERROR'
        })
      );
    });
  });
});