/**
 * Role-Based Access Control (RBAC) Middleware
 * Implements enhanced security features, audit logging, and performance optimization
 * for the Estate Kit platform's access control system.
 * @version 1.0.0
 */

import { Container } from 'typedi'; // ^0.10.0
import { Request, Response, NextFunction } from 'express'; // ^4.18.0
import rateLimit from 'express-rate-limit'; // ^6.7.0

import { DelegateService } from '../../services/delegate.service';
import { AuthorizationError } from '../../utils/error.util';
import { ResourceType, AccessLevel } from '../../types/permission.types';
import { logger } from '../../utils/logger.util';

// Security configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // Maximum requests per window
const IP_WHITELIST = process.env.IP_WHITELIST?.split(',') || [];

/**
 * Interface for rate limit configuration
 */
interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  skipFailedRequests?: boolean;
}

/**
 * Creates rate limiter instance with security configurations
 */
const createRateLimiter = (options: RateLimitOptions = {}) => {
  return rateLimit({
    windowMs: options.windowMs || RATE_LIMIT_WINDOW,
    max: options.max || RATE_LIMIT_MAX,
    skipFailedRequests: options.skipFailedRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => IP_WHITELIST.includes(req.ip || ''),
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        correlationId: req.headers['x-correlation-id']
      });
      res.status(429).json({
        error: 'Too many requests, please try again later',
        correlationId: req.headers['x-correlation-id']
      });
    }
  });
};

/**
 * Higher-order function that creates RBAC middleware for specific resource and access level
 * @param resourceType - Type of resource being accessed
 * @param requiredAccess - Required access level
 * @param rateLimitOptions - Optional rate limiting configuration
 */
export const checkPermission = (
  resourceType: ResourceType,
  requiredAccess: AccessLevel,
  rateLimitOptions?: RateLimitOptions
) => {
  const rateLimiter = createRateLimiter(rateLimitOptions);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const correlationId = req.headers['x-correlation-id'] as string || 
                         `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Apply rate limiting
      await new Promise((resolve) => rateLimiter(req, res, resolve));

      const delegateId = req.headers['x-delegate-id'] as string;
      if (!delegateId) {
        throw new AuthorizationError('Delegate ID not provided');
      }

      // Get delegate service instance
      const delegateService = Container.get(DelegateService);

      // Verify delegate access
      const hasAccess = await delegateService.verifyDelegateAccess(
        delegateId,
        resourceType,
        requiredAccess
      );

      // Log security event
      logger.logSecurityEvent('PERMISSION_CHECK', {
        correlationId,
        delegateId,
        resourceType,
        requiredAccess,
        granted: hasAccess,
        ip: req.ip
      });

      if (!hasAccess) {
        throw new AuthorizationError(
          `Access denied for resource type: ${resourceType}`,
          resourceType
        );
      }

      next();
    } catch (error: any) {
      // Log security event for access denial
      logger.logSecurityEvent('ACCESS_DENIED', {
        correlationId,
        error: error?.message || 'Unknown error',
        resourceType,
        ip: req.ip
      });

      next(error);
    }
  };
};

/**
 * General-purpose RBAC middleware with enhanced security features
 */
export const rbacMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const correlationId = req.headers['x-correlation-id'] as string || 
                       `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Validate security headers
    if (!req.headers['x-delegate-id']) {
      throw new AuthorizationError('Missing delegate credentials');
    }

    const delegateId = req.headers['x-delegate-id'] as string;
    const resourceType = req.headers['x-resource-type'] as ResourceType;
    const requiredAccess = req.headers['x-required-access'] as AccessLevel;

    if (!resourceType || !requiredAccess) {
      throw new AuthorizationError('Missing resource access requirements');
    }

    // Get delegate service instance
    const delegateService = Container.get(DelegateService);

    // Verify permissions
    const hasAccess = await delegateService.verifyDelegateAccess(
      delegateId,
      resourceType,
      requiredAccess
    );

    // Log security event
    logger.logSecurityEvent('PERMISSION_CHECK', {
      correlationId,
      delegateId,
      resourceType,
      requiredAccess,
      granted: hasAccess,
      ip: req.ip
    });

    if (!hasAccess) {
      throw new AuthorizationError(
        `Access denied for resource type: ${resourceType}`,
        resourceType
      );
    }

    next();
  } catch (error: any) {
    // Log security event for access denial
    logger.logSecurityEvent('ACCESS_DENIED', {
      correlationId,
      error: error?.message || 'Unknown error',
      ip: req.ip
    });

    next(error);
  }
};