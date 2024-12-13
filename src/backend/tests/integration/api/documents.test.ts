/**
 * Integration Tests for Document Management API
 * Tests security, access control, validation, encryption and audit logging compliance
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0
import { DocumentsController } from '../../../../src/api/controllers/documents.controller';
import { DocumentService } from '../../../../src/services/document.service';
import { AuditService } from '../../../../src/services/audit.service';
import { 
  Document, 
  DocumentType, 
  DocumentStatus, 
  DocumentPermission 
} from '../../../../src/types/document.types';

// Test constants
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_DELEGATE_ID = '660e8400-e29b-41d4-a716-446655440000';
const TEST_AUTH_TOKEN = 'mock-jwt-token';
const API_BASE_URL = '/api/documents';
const MAX_FILE_SIZE = 10485760; // 10MB

// Mock services
const mockEncryptionService = {
  encryptDocument: jest.fn(),
  verifyEncryption: jest.fn()
};

const mockAuditLogger = {
  createAuditLog: jest.fn(),
  verifyAuditLog: jest.fn()
};

const mockStorageService = {
  storeDocument: jest.fn(),
  retrieveDocument: jest.fn()
};

// Test setup and cleanup functions
async function setupTestDatabase(): Promise<void> {
  // Clear existing test data
  await Promise.all([
    DocumentService.clearTestData(),
    AuditService.clearTestLogs()
  ]);

  // Setup test users and permissions
  await Promise.all([
    createTestUser(TEST_USER_ID),
    createTestDelegate(TEST_DELEGATE_ID)
  ]);

  // Initialize encryption keys and audit logging
  await Promise.all([
    mockEncryptionService.initialize(),
    mockAuditLogger.initialize()
  ]);
}

async function cleanupTestDatabase(): Promise<void> {
  await Promise.all([
    DocumentService.clearTestData(),
    AuditService.clearTestLogs(),
    mockEncryptionService.cleanup(),
    mockStorageService.cleanup()
  ]);
}

describe('Document API Security Integration Tests', () => {
  let app: any;
  let request: supertest.SuperTest<supertest.Test>;

  beforeEach(async () => {
    await setupTestDatabase();
    app = createTestApp();
    request = supertest(app);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Document Creation Security', () => {
    test('should create encrypted document with valid data', async () => {
      const testDoc = {
        title: 'Test Medical Record',
        type: DocumentType.MEDICAL,
        file: Buffer.from('test content'),
        metadata: {
          fileName: 'medical_record.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          retentionPeriod: 730 // 2 years
        }
      };

      const response = await request
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', testDoc.title)
        .field('type', testDoc.type)
        .field('metadata', JSON.stringify(testDoc.metadata))
        .attach('file', testDoc.file, testDoc.metadata.fileName);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      
      // Verify encryption
      const encryptionVerified = await mockEncryptionService.verifyEncryption(
        response.body.data.id
      );
      expect(encryptionVerified).toBe(true);

      // Verify audit log
      const auditLog = await mockAuditLogger.verifyAuditLog({
        eventType: 'DOCUMENT_UPLOAD',
        userId: TEST_USER_ID,
        resourceType: 'MEDICAL_DATA'
      });
      expect(auditLog).toBeTruthy();
    });

    test('should reject document creation without proper encryption', async () => {
      const unencryptedDoc = {
        title: 'Unencrypted Document',
        type: DocumentType.LEGAL,
        file: Buffer.from('unencrypted content'),
        metadata: {
          fileName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          retentionPeriod: 365
        }
      };

      mockEncryptionService.encryptDocument.mockRejectedValueOnce(
        new Error('Encryption failed')
      );

      const response = await request
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send(unencryptedDoc);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('encryption');
    });

    test('should enforce file size limits', async () => {
      const largeFile = Buffer.alloc(MAX_FILE_SIZE + 1);
      const response = await request
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .attach('file', largeFile, 'large.pdf');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('file size');
    });
  });

  describe('Document Access Control', () => {
    test('should enforce role-based access control', async () => {
      // Create test document
      const docId = await createTestDocument(DocumentType.FINANCIAL);

      // Test access with different roles
      const testCases = [
        { role: 'OWNER', expectedStatus: 200 },
        { role: 'FINANCIAL_ADVISOR', expectedStatus: 200 },
        { role: 'HEALTHCARE_PROXY', expectedStatus: 403 }
      ];

      for (const testCase of testCases) {
        const response = await request
          .get(`${API_BASE_URL}/${docId}`)
          .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
          .set('X-User-Role', testCase.role);

        expect(response.status).toBe(testCase.expectedStatus);
      }
    });

    test('should handle delegate permissions correctly', async () => {
      const docId = await createTestDocument(DocumentType.LEGAL);
      
      // Grant delegate access
      await grantDelegateAccess(docId, TEST_DELEGATE_ID, 'READ');

      const response = await request
        .get(`${API_BASE_URL}/${docId}`)
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .set('X-User-Id', TEST_DELEGATE_ID);

      expect(response.status).toBe(200);

      // Verify audit log for delegate access
      const auditLog = await mockAuditLogger.verifyAuditLog({
        eventType: 'DOCUMENT_ACCESS',
        userId: TEST_DELEGATE_ID,
        resourceId: docId
      });
      expect(auditLog).toBeTruthy();
    });
  });

  describe('Document Operations Compliance', () => {
    test('should maintain PIPEDA compliance for operations', async () => {
      const docId = await createTestDocument(DocumentType.MEDICAL);

      // Test document update
      const updateResponse = await request
        .put(`${API_BASE_URL}/${docId}`)
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send({
          title: 'Updated Medical Record',
          metadata: {
            retentionPeriod: 1095 // 3 years
          }
        });

      expect(updateResponse.status).toBe(200);

      // Verify compliance metadata
      const auditLogs = await mockAuditLogger.getAuditLogs({
        resourceId: docId
      });

      expect(auditLogs).toContainEqual(expect.objectContaining({
        eventType: 'DOCUMENT_ACCESS',
        details: expect.objectContaining({
          complianceFlags: expect.objectContaining({
            pipedaRelevant: true,
            hipaaRelevant: true
          })
        })
      }));
    });

    test('should track all document modifications', async () => {
      const docId = await createTestDocument(DocumentType.LEGAL);

      // Perform multiple operations
      const operations = [
        { type: 'update', data: { title: 'Updated Title' } },
        { type: 'access', data: null },
        { type: 'delete', data: null }
      ];

      for (const op of operations) {
        if (op.type === 'update') {
          await request
            .put(`${API_BASE_URL}/${docId}`)
            .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
            .send(op.data);
        } else if (op.type === 'access') {
          await request
            .get(`${API_BASE_URL}/${docId}`)
            .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`);
        } else if (op.type === 'delete') {
          await request
            .delete(`${API_BASE_URL}/${docId}`)
            .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`);
        }
      }

      // Verify audit trail completeness
      const auditTrail = await mockAuditLogger.getAuditLogs({
        resourceId: docId
      });

      expect(auditTrail).toHaveLength(operations.length);
      expect(auditTrail.map(log => log.eventType)).toEqual(
        expect.arrayContaining([
          'DOCUMENT_ACCESS',
          'DOCUMENT_UPLOAD',
          'DOCUMENT_ACCESS'
        ])
      );
    });
  });
});

// Helper functions for test setup
async function createTestUser(userId: string): Promise<void> {
  // Implementation for creating test user
}

async function createTestDelegate(delegateId: string): Promise<void> {
  // Implementation for creating test delegate
}

async function createTestDocument(type: DocumentType): Promise<string> {
  // Implementation for creating test document
}

async function grantDelegateAccess(
  docId: string, 
  delegateId: string, 
  permission: string
): Promise<void> {
  // Implementation for granting delegate access
}

function createTestApp(): any {
  // Implementation for creating test app instance
}