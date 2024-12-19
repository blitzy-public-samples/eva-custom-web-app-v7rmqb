/**
 * User Management Router for Estate Kit Platform
 * Implements secure CRUD operations with PIPEDA/HIPAA compliance and audit logging
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import helmet from 'helmet'; // ^7.0.0
import { RateLimiterMemory } from 'rate-limiter-flexible'; // ^2.4.1
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { Container } from 'typedi';
import { getRepository } from 'typeorm';

// Internal imports
import { UsersController } from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createUserSchema, updateUserSchema } from '../validators/users.validator';
import { logger } from '../../utils/logger.util';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';
import { UserRole } from '../../types/user.types';
import { UserService } from '../../services/user.service';
import { AuditService } from '../../services/audit.service';
import { EncryptionService } from '../../services/encryption.service';
import UserModel from '../../db/models/user.model';
import { AuditModel } from '../../db/models/audit.model';

// Configure rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per minute
  blockDuration: 300 // Block for 5 minutes if exceeded
});

// Initialize services with dependencies
const userRepository = getRepository(UserModel);
const auditRepository = getRepository(AuditModel);
const encryptionService = Container.get(EncryptionService);
const auditService = new AuditService(auditRepository);
const userService = new UserService(userRepository, auditService, encryptionService);

// Initialize router with security settings
const router = Router();
const usersController = new UsersController(userService, auditService);

// Apply security middleware
router.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
}));

// Rate limiting middleware
const rateLimitMiddleware = async (req: any, res: any, next: any) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
      severity: AuditSeverity.WARNING,
      message: 'Rate limit exceeded',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
};

// Apply global middleware
router.use(rateLimitMiddleware);
router.use(authMiddleware);

/**
 * Create new user with enhanced security validation
 * POST /api/users
 */
router.post('/',
  validateRequest(createUserSchema, {
    resourceType: 'USER',
    sensitiveFields: ['email', 'phoneNumber'],
    complianceRequirements: ['PIPEDA', 'HIPAA']
  }),
  async (req: any, res: any, next: any) => {
    try {
      const correlationId = uuidv4();
      logger.addCorrelationId(correlationId);

      const result = await usersController.createUser(
        req.validatedData,
        req.headers['user-agent'] as string,
        req.ip,
        correlationId
      );

      res.status(201).json({
        success: true,
        data: result,
        meta: { correlationId }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get user by ID with role-based access control
 * GET /api/users/:id
 */
router.get('/:id',
  async (req: any, res: any, next: any) => {
    try {
      const correlationId = uuidv4();
      logger.addCorrelationId(correlationId);

      const result = await usersController.getUserById(
        req.params.id,
        req.user?.role as UserRole,
        req.headers['user-agent'] as string,
        req.ip,
        correlationId
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'NOT_FOUND',
            correlationId
          }
        });
      }

      return res.json({
        success: true,
        data: result,
        meta: { correlationId }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update user with security validation and RBAC
 * PUT /api/users/:id
 */
router.put('/:id',
  validateRequest(updateUserSchema, {
    resourceType: 'USER',
    sensitiveFields: ['phoneNumber'],
    complianceRequirements: ['PIPEDA', 'HIPAA']
  }),
  async (req: any, res: any, next: any) => {
    try {
      const correlationId = uuidv4();
      logger.addCorrelationId(correlationId);

      const result = await usersController.updateUser(
        req.params.id,
        req.validatedData,
        req.user?.role as UserRole,
        req.headers['user-agent'] as string,
        req.ip,
        correlationId
      );

      res.json({
        success: true,
        data: result,
        meta: { correlationId }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Delete user with admin-only access
 * DELETE /api/users/:id
 */
router.delete('/:id',
  async (req: any, res: any, next: any) => {
    try {
      const correlationId = uuidv4();
      logger.addCorrelationId(correlationId);

      await usersController.deleteUser(
        req.params.id,
        req.user?.role as UserRole,
        req.headers['user-agent'] as string,
        req.ip,
        correlationId
      );

      res.json({
        success: true,
        meta: { correlationId }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Error handling middleware
router.use((error: any, req: any, res: any, next: any) => {
  const correlationId = uuidv4();
  logger.error('User route error', {
    error,
    correlationId,
    path: req.path,
    method: req.method
  });

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      correlationId
    }
  });
});

export { router as userRouter };