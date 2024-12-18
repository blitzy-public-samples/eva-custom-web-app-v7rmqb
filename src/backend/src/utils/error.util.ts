/**
 * Estate Kit Error Handling Utility
 * Provides standardized error handling with enhanced security monitoring and compliance features
 * @module error
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { logger } from '../utils/logger.util';
import { AuditEventType } from '../types/audit.types';

/**
 * Security impact levels for error classification
 */
export enum SecurityImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Interface for security context metadata
 */
interface SecurityContext {
  impactLevel: SecurityImpactLevel;
  compliance?: string[];
  sensitiveData?: boolean;
  resourceType?: string;
  userId?: string;
}

/**
 * Interface for standardized error response
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    correlationId: string;
    statusCode: number;
    details?: Record<string, any>;
  };
}

/**
 * Enhanced base error class with security monitoring and compliance features
 */
export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: Record<string, any>;
  public readonly correlationId: string;
  public readonly securityLevel: SecurityImpactLevel;
  public readonly securityContext: SecurityContext;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details: Record<string, any> = {},
    securityContext: Partial<SecurityContext> = {}
  ) {
    super(message);
    
    // Basic error setup
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Error tracking
    this.correlationId = uuidv4();
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = this.sanitizeErrorDetails(details);
    
    // Security context setup
    this.securityLevel = securityContext.impactLevel || SecurityImpactLevel.LOW;
    this.securityContext = {
      impactLevel: this.securityLevel,
      compliance: securityContext.compliance || ['PIPEDA', 'HIPAA'],
      sensitiveData: securityContext.sensitiveData || false,
      resourceType: securityContext.resourceType,
      userId: securityContext.userId
    };

    // Log error with security classification
    this.logError();
    
    // Create audit trail for security-relevant errors
    if (this.securityLevel >= SecurityImpactLevel.MEDIUM) {
      this.createSecurityAudit();
    }
  }

  /**
   * Sanitizes error details to remove sensitive information
   */
  private sanitizeErrorDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'sin', 'ssn', 'creditCard'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }

  /**
   * Logs error with security context
   */
  private logError(): void {
    logger.error(`[${this.errorCode}] ${this.message}`, {
      correlationId: this.correlationId,
      statusCode: this.statusCode,
      securityContext: this.securityContext,
      details: this.details,
      stack: this.stack
    });
  }

  /**
   * Creates security audit entry for security-relevant errors
   */
  private createSecurityAudit(): void {
    logger.securityEvent(AuditEventType.ERROR, {
      correlationId: this.correlationId,
      errorCode: this.errorCode,
      securityLevel: this.securityLevel,
      securityContext: this.securityContext,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Formats error into standardized API response with security considerations
 */
export function formatErrorResponse(error: Error): ErrorResponse {
  const baseError = error instanceof BaseError ? error : new BaseError(error.message);
  
  return {
    success: false,
    error: {
      message: baseError.message,
      code: baseError.errorCode,
      correlationId: baseError.correlationId,
      statusCode: baseError.statusCode,
      details: baseError.securityContext.sensitiveData ? undefined : baseError.details
    }
  };
}

/**
 * Enhanced global error handler with security monitoring
 */
export function handleError(error: Error): ErrorResponse {
  // Convert to BaseError if not already
  const baseError = error instanceof BaseError ? error : new BaseError(
    error.message,
    500,
    'INTERNAL_ERROR',
    {},
    { impactLevel: SecurityImpactLevel.MEDIUM }
  );

  // Check for security thresholds
  if (baseError.securityLevel === SecurityImpactLevel.CRITICAL) {
    // Trigger immediate security alert
    logger.securityEvent(AuditEventType.SECURITY_EVENT, {
      correlationId: baseError.correlationId,
      errorCode: baseError.errorCode,
      securityLevel: baseError.securityLevel,
      message: 'Critical security error detected',
      timestamp: new Date().toISOString()
    });
  }

  return formatErrorResponse(baseError);
}

/**
 * Predefined error classes for common scenarios
 */
export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details, {
      impactLevel: SecurityImpactLevel.LOW
    });
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR', {}, {
      impactLevel: SecurityImpactLevel.MEDIUM,
      sensitiveData: true
    });
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string, resourceType?: string) {
    super(message, 403, 'AUTHORIZATION_ERROR', {}, {
      impactLevel: SecurityImpactLevel.HIGH,
      resourceType,
      sensitiveData: true
    });
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, resourceType?: string) {
    super(message, 404, 'NOT_FOUND_ERROR', {}, {
      impactLevel: SecurityImpactLevel.LOW,
      resourceType
    });
  }
}