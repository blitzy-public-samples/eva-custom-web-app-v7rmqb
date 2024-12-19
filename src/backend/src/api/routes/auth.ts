/**
 * Authentication Router for Estate Kit Platform
 * Implements secure Auth0 integration with enhanced security features,
 * PIPEDA/HIPAA compliance, and comprehensive audit logging
 * @module auth.router
 * @version 1.0.0
 */

import express from 'express'; // v4.18.2
import helmet from 'helmet'; // v7.0.0
import rateLimit from 'express-rate-limit'; // v6.7.0
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { z } from 'zod'; // v3.22.0
import { logger } from '../../utils/logger.util';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';
import { AuthService } from '../../services/auth.service';

// Initialize router with security defaults
const router = express.Router();

// Apply security headers
router.use(helmet());

// Initialize Auth Controller with AuthService
const authService = new AuthService();
const authController = new AuthController(authService);

// Rate limiting configuration for authentication endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
      severity: AuditSeverity.WARNING,
      message: 'Rate limit exceeded for authentication',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts'
    });
  }
});

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  deviceId: z.string().optional()
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(12),
  province: z.string(),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'Terms must be accepted'
  })
});

// Authentication Routes
router.post('/login',
  authRateLimiter,
  validateRequest(loginSchema, {
    resourceType: 'authentication',
    sensitiveFields: ['password'],
    complianceRequirements: ['PIPEDA', 'HIPAA']
  }),
  async (req, res, next) => {
    try {
      await authController.login(req, res);
    } catch (error) {
      logger.error('Login failed', {
        error,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      next(error);
    }
  }
);

router.post('/register',
  authRateLimiter,
  validateRequest(registerSchema, {
    resourceType: 'user',
    sensitiveFields: ['password'],
    complianceRequirements: ['PIPEDA', 'HIPAA']
  }),
  async (req, res, next) => {
    try {
      await authController.register(req, res);
    } catch (error) {
      logger.error('Registration failed', {
        error,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      next(error);
    }
  }
);

router.post('/refresh-token',
  authMiddleware,
  async (req, res, next) => {
    try {
      await authController.refreshToken(req, res);
    } catch (error) {
      logger.error('Token refresh failed', {
        error,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      next(error);
    }
  }
);

router.post('/logout',
  authMiddleware,
  async (req, res, next) => {
    try {
      await authController.logout(req, res);
    } catch (error) {
      logger.error('Logout failed', {
        error,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      next(error);
    }
  }
);

// Global error handler for authentication routes
router.use((error: any, req: express.Request, res: express.Response) => {
  logger.error('Authentication route error', {
    error,
    path: req.path,
    method: req.method,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      correlationId: req.headers['x-correlation-id']
    }
  });
});

export default router;