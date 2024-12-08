/**
 * Estate Kit - Document API Integration Tests
 * 
 * Human Tasks:
 * 1. Configure test database with appropriate test data
 * 2. Set up test environment variables for authentication
 * 3. Review test coverage requirements and add additional test cases if needed
 * 4. Ensure test cleanup properly removes test data
 */

// @package supertest ^6.3.3
import request from 'supertest';
// @package jest ^29.0.0
import { describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Import controllers and models
import { 
  createDocumentHandler,
  getDocumentHandler,
  updateDocumentHandler,
  deleteDocumentHandler 
} from '../../src/api/controllers/documents.controller';
import { DocumentModel } from '../../src/db/models/document.model';
import { validateDocument } from '../../src/utils/validation.util';
import { handleError } from '../../src/utils/error.util';

// Mock Express app for testing
const app = require('../../src/app');

// Test data
const testDocument = {
  title: 'Test Document',
  category: 'legal',
  status: 'draft',
  metadata: {
    version: '1.0',
    size: 1024,
    mimeType: 'application/pdf',
    originalName: 'test.pdf'
  }
};

const testUser = {
  userId: '12345',
  email: 'test@example.com',
  role: 'owner'
};

// Test setup and cleanup
beforeAll(async () => {
  // Set up test database connection
  await require('../../src/db/config/database.config').connect();
});

afterAll(async () => {
  // Clean up test database
  await DocumentModel.destroy({ where: {} });
  await require('../../src/db/config/database.config').disconnect();
});

beforeEach(async () => {
  // Clear documents before each test
  await DocumentModel.destroy({ where: {} });
});

describe('Document API Integration Tests', () => {
  /**
   * Test document creation endpoint
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
   */
  describe('POST /api/documents', () => {
    test('should create a new document with valid data', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`)
        .send(testDocument);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Document created successfully');
      expect(response.body.document).toHaveProperty('documentId');
      expect(response.body.document.title).toBe(testDocument.title);
      expect(validateDocument(response.body.document)).toBe(true);
    });

    test('should reject document creation with invalid data', async () => {
      const invalidDocument = { ...testDocument, category: 'invalid' };
      
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`)
        .send(invalidDocument);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid document data');
    });

    test('should require authentication for document creation', async () => {
      const response = await request(app)
        .post('/api/documents')
        .send(testDocument);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test document retrieval endpoint
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
   */
  describe('GET /api/documents/:id', () => {
    let documentId: string;

    beforeEach(async () => {
      // Create a test document
      const doc = await DocumentModel.create({
        ...testDocument,
        userId: testUser.userId
      });
      documentId = doc.documentId;
    });

    test('should retrieve an existing document', async () => {
      const response = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.document).toHaveProperty('documentId', documentId);
      expect(response.body.document.title).toBe(testDocument.title);
    });

    test('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .get('/api/documents/non-existent-id')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Document not found');
    });

    test('should enforce RBAC for document access', async () => {
      const response = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${process.env.TEST_DELEGATE_TOKEN}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test document update endpoint
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
   */
  describe('PUT /api/documents/:id', () => {
    let documentId: string;

    beforeEach(async () => {
      const doc = await DocumentModel.create({
        ...testDocument,
        userId: testUser.userId
      });
      documentId = doc.documentId;
    });

    test('should update an existing document', async () => {
      const updateData = {
        title: 'Updated Document',
        status: 'approved'
      };

      const response = await request(app)
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Document updated successfully');
      
      // Verify update
      const updatedDoc = await DocumentModel.findByPk(documentId);
      expect(updatedDoc?.title).toBe(updateData.title);
      expect(updatedDoc?.status).toBe(updateData.status);
    });

    test('should reject invalid update data', async () => {
      const invalidUpdate = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid update data');
    });
  });

  /**
   * Test document deletion endpoint
   * Requirements Addressed:
   * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
   * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
   */
  describe('DELETE /api/documents/:id', () => {
    let documentId: string;

    beforeEach(async () => {
      const doc = await DocumentModel.create({
        ...testDocument,
        userId: testUser.userId
      });
      documentId = doc.documentId;
    });

    test('should delete an existing document', async () => {
      const response = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Document deleted successfully');

      // Verify deletion
      const deletedDoc = await DocumentModel.findByPk(documentId);
      expect(deletedDoc).toBeNull();
    });

    test('should return 404 for non-existent document', async () => {
      const response = await request(app)
        .delete('/api/documents/non-existent-id')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Document not found');
    });

    test('should enforce RBAC for document deletion', async () => {
      const response = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${process.env.TEST_DELEGATE_TOKEN}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test error handling and monitoring
   * Requirements Addressed:
   * - Monitoring & Observability (Technical Specifications/2.7 Cross-Cutting Concerns/Monitoring & Observability)
   */
  describe('Error Handling', () => {
    test('should log errors appropriately', async () => {
      const errorSpy = jest.spyOn(console, 'error');
      
      await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`)
        .send({ invalid: 'data' });

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    test('should handle database connection errors', async () => {
      // Simulate database connection error
      jest.spyOn(DocumentModel, 'create').mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`)
        .send(testDocument);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});