/**
 * Estate Kit - Document Routes
 * 
 * Human Tasks:
 * 1. Configure rate limiting for document API endpoints
 * 2. Set up monitoring alerts for document operation failures
 * 3. Review document size limits and storage quotas
 * 4. Verify document category permissions match business rules
 */

// @package express v4.18.2
import { Router } from 'express';
import {
  createDocumentHandler,
  getDocumentHandler,
  updateDocumentHandler,
  deleteDocumentHandler
} from '../controllers/documents.controller';
import { validateDocumentInput } from '../validators/documents.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';
import { logError } from '../../utils/logger.util';

// Initialize router
const router = Router();

/**
 * POST /documents
 * Creates a new document
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements document creation functionality
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Ensures only authenticated users can create documents
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces RBAC for document creation
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware({
    requiredRole: 'owner',
    requiredPermissions: [{
      resourceType: 'document',
      accessLevel: 'write'
    }]
  }),
  async (req, res) => {
    try {
      // Validate document input
      if (!validateDocumentInput(req.body)) {
        res.status(400).json({
          error: 'Invalid document data',
          message: 'The provided document data failed validation'
        });
        return;
      }

      await createDocumentHandler(req, res);
    } catch (error) {
      logError(error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create document'
      });
    }
  }
);

/**
 * GET /documents/:id
 * Retrieves a document by ID
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements document retrieval functionality
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Ensures only authenticated users can retrieve documents
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces RBAC for document access
 */
router.get(
  '/:id',
  authMiddleware,
  rbacMiddleware({
    requiredPermissions: [{
      resourceType: 'document',
      accessLevel: 'read'
    }]
  }),
  async (req, res) => {
    try {
      await getDocumentHandler(req, res);
    } catch (error) {
      logError(error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve document'
      });
    }
  }
);

/**
 * PUT /documents/:id
 * Updates an existing document
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements document update functionality
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Ensures only authenticated users can update documents
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces RBAC for document updates
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Validates update data before processing
 */
router.put(
  '/:id',
  authMiddleware,
  rbacMiddleware({
    requiredPermissions: [{
      resourceType: 'document',
      accessLevel: 'write'
    }]
  }),
  async (req, res) => {
    try {
      // Validate update data
      if (!validateDocumentInput(req.body)) {
        res.status(400).json({
          error: 'Invalid document data',
          message: 'The provided update data failed validation'
        });
        return;
      }

      await updateDocumentHandler(req, res);
    } catch (error) {
      logError(error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update document'
      });
    }
  }
);

/**
 * DELETE /documents/:id
 * Deletes a document
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements document deletion functionality
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Ensures only authenticated users can delete documents
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces RBAC for document deletion
 */
router.delete(
  '/:id',
  authMiddleware,
  rbacMiddleware({
    requiredRole: 'owner',
    requiredPermissions: [{
      resourceType: 'document',
      accessLevel: 'manage'
    }]
  }),
  async (req, res) => {
    try {
      await deleteDocumentHandler(req, res);
    } catch (error) {
      logError(error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete document'
      });
    }
  }
);

// Export the router
export default router;