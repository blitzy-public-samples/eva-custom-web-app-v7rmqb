/**
 * Estate Kit - Documents Controller
 * 
 * Human Tasks:
 * 1. Configure rate limiting for document API endpoints
 * 2. Set up monitoring alerts for document operation failures
 * 3. Review document size limits and storage quotas
 * 4. Verify document category permissions match business rules
 */

import { Request, Response } from 'express';
import { validateDocumentInput } from '../validators/documents.validator';
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument 
} from '../../services/document.service';
import { handleError } from '../../utils/error.util';
import { logError } from '../../utils/logger.util';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequestMiddleware } from '../middlewares/validation.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

/**
 * Handles the creation of a new document.
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * 
 * @param req - Express request object containing document data
 * @param res - Express response object
 */
export const createDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract document data from request body
    const documentData = req.body;

    // Validate document input data
    if (!validateDocumentInput(documentData)) {
      res.status(400).json({
        error: 'Invalid document data',
        message: 'The provided document data failed validation'
      });
      return;
    }

    // Add user information from authenticated request
    documentData.userId = req.user?.userId;
    documentData.createdBy = req.user?.email;

    // Create document using service layer
    const createdDocument = await createDocument(documentData);

    // Send success response
    res.status(201).json({
      message: 'Document created successfully',
      document: createdDocument
    });

  } catch (error) {
    // Handle and log error
    handleError(error as Error);
    logError(error as Error);
    res.status(500).json({
      error: 'Failed to create document',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

/**
 * Handles the retrieval of a document by ID.
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * 
 * @param req - Express request object containing document ID
 * @param res - Express response object
 */
export const getDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    if (!documentId) {
      res.status(400).json({
        error: 'Missing document ID',
        message: 'Document ID is required'
      });
      return;
    }

    // Retrieve document using service layer
    const document = await getDocument(documentId);

    if (!document) {
      res.status(404).json({
        error: 'Document not found',
        message: `No document found with ID: ${documentId}`
      });
      return;
    }

    // Send success response
    res.status(200).json({
      message: 'Document retrieved successfully',
      document
    });

  } catch (error) {
    // Handle and log error
    handleError(error as Error);
    logError(error as Error);
    res.status(500).json({
      error: 'Failed to retrieve document',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

/**
 * Handles the update of an existing document.
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * 
 * @param req - Express request object containing document ID and update data
 * @param res - Express response object
 */
export const updateDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract document ID and update data
    const { documentId } = req.params;
    const updateData = req.body;

    if (!documentId) {
      res.status(400).json({
        error: 'Missing document ID',
        message: 'Document ID is required'
      });
      return;
    }

    // Validate update data
    if (!validateDocumentInput(updateData)) {
      res.status(400).json({
        error: 'Invalid update data',
        message: 'The provided update data failed validation'
      });
      return;
    }

    // Add user information from authenticated request
    updateData.updatedBy = req.user?.email;
    updateData.updatedAt = new Date();

    // Update document using service layer
    const success = await updateDocument(documentId, updateData);

    if (!success) {
      res.status(404).json({
        error: 'Document not found',
        message: `No document found with ID: ${documentId}`
      });
      return;
    }

    // Send success response
    res.status(200).json({
      message: 'Document updated successfully',
      documentId
    });

  } catch (error) {
    // Handle and log error
    handleError(error as Error);
    logError(error as Error);
    res.status(500).json({
      error: 'Failed to update document',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

/**
 * Handles the deletion of a document.
 * 
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * 
 * @param req - Express request object containing document ID
 * @param res - Express response object
 */
export const deleteDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    if (!documentId) {
      res.status(400).json({
        error: 'Missing document ID',
        message: 'Document ID is required'
      });
      return;
    }

    // Delete document using service layer
    const success = await deleteDocument(documentId);

    if (!success) {
      res.status(404).json({
        error: 'Document not found',
        message: `No document found with ID: ${documentId}`
      });
      return;
    }

    // Send success response
    res.status(200).json({
      message: 'Document deleted successfully',
      documentId
    });

  } catch (error) {
    // Handle and log error
    handleError(error as Error);
    logError(error as Error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};