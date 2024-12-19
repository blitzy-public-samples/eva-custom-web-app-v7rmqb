/**
 * Delegate Management Router for Estate Kit Platform
 * Implements secure, compliant, and audited routes for delegate lifecycle management
 * @module delegates.router
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import rateLimit from 'express-rate-limit'; // ^6.7.0
import { Container } from 'typedi';

// Internal imports
import { DelegatesController } from '../controllers/delegates.controller';
import { DelegateService } from '../../services/delegate.service';
import { AuditService } from '../../services/audit.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware, checkPermission } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createDelegateSchema, updateDelegateSchema, delegateIdSchema } from '../validators/delegates.validator';
import { ResourceType, AccessLevel } from '../../types/permission.types';
import { logger } from '../../utils/logger.util';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

// Initialize router
const delegatesRouter = Router();

// Configure rate limiting
const delegateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});

/**
 * POST /delegates
 * Create new delegate relationship with comprehensive validation
 */
delegatesRouter.post('/',
  delegateRateLimit,
  authMiddleware,
  rbacMiddleware,
  validateRequest(createDelegateSchema, {
    resourceType: 'DELEGATE',
    sensitiveFields: ['email'],
    complianceRequirements: ['PIPEDA', 'HIPAA']
  }),
  async (req, res, next) => {
    try {
      const delegateService = Container.get(DelegateService);
      const auditService = Container.get(AuditService);
      const controller = new DelegatesController(delegateService, auditService);
      const result = await controller.createDelegate(req.validatedData);

      logger.info('Delegate created successfully', {
        delegateId: result.id,
        ownerId: result.ownerId,
        correlationId: req.headers['x-correlation-id']
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /delegates
 * List delegates with pagination and filtering
 */
delegatesRouter.get('/',
  delegateRateLimit,
  authMiddleware,
  checkPermission(ResourceType.PERSONAL_INFO, AccessLevel.READ),
  async (req, res, next) => {
    try {
      const delegateService = Container.get(DelegateService);
      const auditService = Container.get(AuditService);
      const controller = new DelegatesController(delegateService, auditService);
      const { page = 1, limit = 10, status, role } = req.query;
      
      const result = await controller.getDelegates({
        page: Number(page),
        limit: Number(limit),
        status,
        role,
        ownerId: (req as any).user?.sub
      });

      res.status(200).json({
        success: true,
        data: result.delegates,
        pagination: {
          total: result.total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(result.total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /delegates/:id
 * Get specific delegate by ID with security validation
 */
delegatesRouter.get('/:id',
  delegateRateLimit,
  authMiddleware,
  checkPermission(ResourceType.PERSONAL_INFO, AccessLevel.READ),
  validateRequest(delegateIdSchema),
  async (req, res, next) => {
    try {
      const delegateService = Container.get(DelegateService);
      const auditService = Container.get(AuditService);
      const controller = new DelegatesController(delegateService, auditService);
      const result = await controller.getDelegate(req.params.id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Delegate not found',
            code: 'DELEGATE_NOT_FOUND'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /delegates/:id
 * Update delegate with comprehensive validation
 */
delegatesRouter.put('/:id',
  delegateRateLimit,
  authMiddleware,
  checkPermission(ResourceType.PERSONAL_INFO, AccessLevel.WRITE),
  validateRequest(updateDelegateSchema, {
    resourceType: 'DELEGATE',
    sensitiveFields: ['permissions'],
    complianceRequirements: ['PIPEDA', 'HIPAA']
  }),
  async (req, res, next) => {
    try {
      const delegateService = Container.get(DelegateService);
      const auditService = Container.get(AuditService);
      const controller = new DelegatesController(delegateService, auditService);
      const result = await controller.updateDelegate(
        req.params.id,
        req.validatedData
      );

      logger.info('Delegate updated successfully', {
        delegateId: req.params.id,
        changes: req.validatedData,
        correlationId: req.headers['x-correlation-id']
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /delegates/:id
 * Revoke delegate access with security confirmation
 */
delegatesRouter.delete('/:id',
  delegateRateLimit,
  authMiddleware,
  checkPermission(ResourceType.PERSONAL_INFO, AccessLevel.WRITE),
  validateRequest(delegateIdSchema),
  async (req, res, next) => {
    try {
      const delegateService = Container.get(DelegateService);
      const auditService = Container.get(AuditService);
      const controller = new DelegatesController(delegateService, auditService);
      await controller.revokeDelegate(req.params.id);

      logger.logSecurityEvent(AuditEventType.DELEGATE_ACCESS, {
        severity: AuditSeverity.WARNING,
        message: 'Delegate access revoked',
        delegateId: req.params.id,
        userId: (req as any).user?.sub,
        correlationId: req.headers['x-correlation-id']
      });

      res.status(200).json({
        success: true,
        message: 'Delegate access revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Error handling middleware
delegatesRouter.use((error: any, req: any, res: any, _next: any) => {
  logger.error('Delegate router error', {
    error: error.message,
    stack: error.stack,
    correlationId: req.headers['x-correlation-id']
  });

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message,
      code: error.errorCode || 'INTERNAL_SERVER_ERROR',
      correlationId: req.headers['x-correlation-id']
    }
  });
});

export { delegatesRouter };