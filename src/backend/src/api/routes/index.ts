/**
 * Main Router Configuration for Estate Kit Platform
 * Centralizes and exports all API routes with enhanced security features
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import helmet from 'helmet'; // ^7.0.0

// Import route modules
import authRouter from './auth';
import { userRouter } from './users';
import documentsRouter from './documents';
import { delegatesRouter } from './delegates';
import subscriptionsRouter from './subscriptions';

// Import security utilities
import { logger } from '../../utils/logger.util';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

// Initialize main router
const router = Router();

/**
 * Configures and initializes all API routes with proper versioning and prefixes
 * Implements comprehensive security features and audit logging
 */
export function configureApiRoutes(): Router {
  // Apply security middleware to all routes
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

  // Mount API routes with versioning
  router.use('/api/v1/auth', authRouter);
  router.use('/api/v1/users', userRouter);
  router.use('/api/v1/documents', documentsRouter);
  router.use('/api/v1/delegates', delegatesRouter);
  router.use('/api/v1/subscriptions', subscriptionsRouter);

  // Log route initialization
  logger.info('API routes initialized', {
    routes: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/documents',
      '/api/v1/delegates',
      '/api/v1/subscriptions'
    ]
  });

  // Global error handler for unhandled routes
  router.use((req, res) => {
    logger.logSecurityEvent(AuditEventType.PERMISSION_CHANGE, {
      severity: AuditSeverity.WARNING,
      message: 'Attempted access to non-existent route',
      path: req.path,
      method: req.method,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
        correlationId: req.headers['x-correlation-id']
      }
    });
  });

  // Global error handler for uncaught exceptions
  router.use((error: Error, req: any, res: any, _next: any) => {
    logger.error('Uncaught exception in API routes', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      correlationId: req.headers['x-correlation-id']
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        correlationId: req.headers['x-correlation-id']
      }
    });
  });

  return router;
}

// Export configured router
export default configureApiRoutes();