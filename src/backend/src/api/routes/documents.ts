/**
 * Document Routes Configuration for Estate Kit Platform
 * Implements secure document management endpoints with comprehensive validation,
 * encryption, and compliance features.
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import multer from 'multer'; // ^1.4.5-lts.1
import rateLimit from 'express-rate-limit'; // ^6.7.0
import { Request, Response, NextFunction } from 'express';

import { DocumentsController } from '../controllers/documents.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  createDocumentSchema, 
  updateDocumentSchema, 
  listDocumentsSchema 
} from '../validators/documents.validator';
import { DocumentService } from '../../services/document.service';
import { AuditService } from '../../services/audit.service';

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
    (req: Request, res: Response, next: NextFunction) => controller.createDocument(req as any, res).catch(next)
  );

  // Get specific document endpoint
  router.get('/:id',
    rateLimit(RATE_LIMITS.read),
    authMiddleware,
    validateRequest(listDocumentsSchema, {
      resourceType: 'DOCUMENT'
    }),
    (req: Request, res: Response, next: NextFunction) => controller.getDocument(req as any, res).catch(next)
  );

  // List documents endpoint with pagination and filtering
  router.get('/',
    rateLimit(RATE_LIMITS.read),
    authMiddleware,
    validateRequest(listDocumentsSchema, {
      resourceType: 'DOCUMENT'
    }),
    (req: Request, res: Response, next: NextFunction) => controller.listDocuments(req as any, res).catch(next)
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
    (req: Request, res: Response, next: NextFunction) => controller.updateDocument(req as any, res).catch(next)
  );

  // Delete document endpoint
  router.delete('/:id',
    rateLimit(RATE_LIMITS.delete),
    authMiddleware,
    validateRequest(listDocumentsSchema, {
      resourceType: 'DOCUMENT'
    }),
    (req: Request, res: Response, next: NextFunction) => controller.deleteDocument(req as any, res).catch(next)
  );

  // Error handling middleware
  router.use((error: Error, _req: Request, res: Response, next: NextFunction) => {
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

    return next(error);
  });

  return router;
}

// Create and export configured router
const documentsRouter = Router();
// Note: Dependencies will be injected by NestJS DI system
const documentService = new DocumentService(/* dependencies will be injected by NestJS */);
const auditService = new AuditService(/* dependencies will be injected by NestJS */);
const documentsController = new DocumentsController(documentService, auditService);
export default configureDocumentRoutes(documentsRouter, documentsController);