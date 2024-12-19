/**
 * Document Routes Configuration for Estate Kit Platform
 * Implements secure document management endpoints with comprehensive validation,
 * encryption, and compliance features.
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import multer from 'multer'; // ^1.4.5-lts.1
import rateLimit from 'express-rate-limit'; // ^6.7.0

import { DocumentsController } from '../controllers/documents.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  createDocumentSchema, 
  updateDocumentSchema, 
  listDocumentsSchema 
} from '../validators/documents.validator';

// Constants for security and validation
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Rate limiting configurations
const RATE_LIMITS = {
  create: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  read: { windowMs: 15 * 60 * 1000, max: 300 },   // 300 requests per 15 minutes
  update: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  delete: { windowMs: 15 * 60 * 1000, max: 50 }   // 50 requests per 15 minutes
};

/**
 * Configure multer for secure file uploads
 */
const upload = multer({
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * Configure document routes with comprehensive security features
 */
export function configureDocumentRoutes(
  router: Router = Router(),
  controller: DocumentsController
): Router {
  // Create document endpoint with enhanced security
  router.post('/',
    rateLimit(RATE_LIMITS.create),
    authMiddleware,
    upload.single('file'),
    validateRequest(createDocumentSchema, {
      resourceType: 'DOCUMENT',
      sensitiveFields: ['file'],
      complianceRequirements: ['PIPEDA', 'HIPAA']
    }),
    controller.createDocument
  );

  // Get specific document endpoint
  router.get('/:id',
    rateLimit(RATE_LIMITS.read),
    authMiddleware,
    validateRequest(listDocumentsSchema, {
      resourceType: 'DOCUMENT'
    }),
    controller.getDocument
  );

  // List documents endpoint with pagination and filtering
  router.get('/',
    rateLimit(RATE_LIMITS.read),
    authMiddleware,
    validateRequest(listDocumentsSchema, {
      resourceType: 'DOCUMENT'
    }),
    controller.listDocuments
  );

  // Update document endpoint
  router.put('/:id',
    rateLimit(RATE_LIMITS.update),
    authMiddleware,
    validateRequest(updateDocumentSchema, {
      resourceType: 'DOCUMENT',
      sensitiveFields: ['metadata'],
      complianceRequirements: ['PIPEDA', 'HIPAA']
    }),
    controller.updateDocument
  );

  // Delete document endpoint
  router.delete('/:id',
    rateLimit(RATE_LIMITS.delete),
    authMiddleware,
    validateRequest(listDocumentsSchema, {
      resourceType: 'DOCUMENT'
    }),
    controller.deleteDocument
  );

  // Error handling middleware
  router.use((error: Error, _req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File upload error',
          details: error.message
        }
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: error.message
        }
      });
    }

    next(error);
  });

  return router;
}

// Create and export configured router
const documentsRouter = Router();
const documentsController = new DocumentsController();
export default configureDocumentRoutes(documentsRouter, documentsController);