/**
 * Estate Kit Error Handling Middleware
 * Provides centralized error handling with security monitoring, PII protection,
 * and compliance features for the Estate Kit backend API
 * @module errorMiddleware
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // v4.18.0
import { logger } from '../../utils/logger.util';
import { formatErrorResponse, BaseError, SecurityImpactLevel } from '../../utils/error.util';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

// Error rate monitoring thresholds
const ERROR_MONITORING = {
  RATE_WINDOW: 60 * 1000, // 1 minute
  THRESHOLD: {
    TOTAL: 100, // Max errors per minute
    CRITICAL: 5  // Max critical errors per minute
  }
};

// Error counters for monitoring
let errorStats = {
  timestamp: Date.now(),
  total: 0,
  critical: 0
};

/**
 * Resets error statistics for the new monitoring window
 */
const resetErrorStats = (): void => {
  errorStats = {
    timestamp: Date.now(),
    total: 0,
    critical: 0
  };
};

/**
 * Tracks error rates and triggers alerts if thresholds are exceeded
 * @param error - The error being processed
 */
const trackErrorRate = (error: BaseError): void => {
  const now = Date.now();
  
  // Reset stats if outside current window
  if (now - errorStats.timestamp > ERROR_MONITORING.RATE_WINDOW) {
    resetErrorStats();
  }

  // Update error counts
  errorStats.total++;
  if (error instanceof BaseError && error.securityLevel === SecurityImpactLevel.CRITICAL) {
    errorStats.critical++;
  }

  // Check thresholds and trigger alerts
  if (errorStats.total >= ERROR_MONITORING.THRESHOLD.TOTAL) {
    logger.logSecurityEvent(AuditEventType.PERMISSION_CHANGE, {
      message: 'Error rate threshold exceeded',
      count: errorStats.total,
      window: ERROR_MONITORING.RATE_WINDOW,
      severity: AuditSeverity.WARNING
    });
  }

  if (errorStats.critical >= ERROR_MONITORING.THRESHOLD.CRITICAL) {
    logger.logSecurityEvent(AuditEventType.PERMISSION_CHANGE, {
      message: 'Critical error rate threshold exceeded',
      count: errorStats.critical,
      window: ERROR_MONITORING.RATE_WINDOW,
      severity: AuditSeverity.CRITICAL
    });
  }
};

/**
 * Creates security context for error logging
 * @param req - Express request object
 * @param error - The error being processed
 */
const createSecurityContext = (req: Request & { user?: { id: string } }, error: Error) => ({
  userId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  path: req.path,
  method: req.method,
  correlationId: req.headers['x-correlation-id'] as string,
  errorType: error instanceof BaseError ? error.errorCode : 'UNKNOWN_ERROR'
});

/**
 * Enhanced Express error handling middleware with security monitoring
 * and compliance features
 */
const errorMiddleware = (
  error: Error,
  req: Request & { user?: { id: string } },
  res: Response,
  _next: NextFunction
): void => {
  try {
    // Create security context for error tracking
    const securityContext = createSecurityContext(req, error);

    // Convert to BaseError if not already
    const baseError = error instanceof BaseError ? error : new BaseError(
      error.message,
      500,
      'INTERNAL_ERROR',
      {},
      { impactLevel: SecurityImpactLevel.MEDIUM }
    );

    // Track error rates
    trackErrorRate(baseError);

    // Log error with security context
    logger.error(`API Error: ${error.message}`, {
      error: baseError,
      securityContext,
      stack: error.stack
    });

    // Create audit log entry
    logger.logSecurityEvent(AuditEventType.PERMISSION_CHANGE, {
      eventType: AuditEventType.PERMISSION_CHANGE,
      severity: baseError.securityLevel === SecurityImpactLevel.CRITICAL ? 
        AuditSeverity.CRITICAL : AuditSeverity.ERROR,
      userId: securityContext.userId || 'SYSTEM',
      resourceId: null,
      resourceType: 'API',
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent,
      details: {
        path: securityContext.path,
        method: securityContext.method,
        errorCode: baseError.errorCode,
        correlationId: securityContext.correlationId
      }
    });

    // Format error response with PII protection
    const errorResponse = formatErrorResponse(baseError);

    // Send error response
    res.status(baseError.statusCode).json(errorResponse);
  } catch (handlingError) {
    // Fallback error handling if error processing fails
    logger.error('Error in error handling middleware', {
      originalError: error,
      handlingError
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500
      }
    });
  }
};

export default errorMiddleware;