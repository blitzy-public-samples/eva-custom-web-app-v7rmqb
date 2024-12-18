/**
 * Estate Kit Validation Middleware
 * Provides centralized request validation with enhanced security features and compliance
 * @module validation.middleware
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // v4.18.2
import { z } from 'zod'; // v3.22.0
import { ValidationError } from '../../utils/error.util';
import { sanitizeInput } from '../../utils/validation.util';

/**
 * Security-enhanced validation context
 */
interface ValidationContext {
  resourceType: string;
  sensitiveFields: string[];
  complianceRequirements: string[];
}

/**
 * Enhanced validation error details
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  context?: Record<string, any>;
}

/**
 * Creates a validation middleware for request body
 * @param schema - Zod schema for validation
 * @param context - Optional validation context for enhanced security
 */
export const validateRequest = (
  schema: z.Schema,
  context: Partial<ValidationContext> = {}
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      const sanitizedBody = Object.entries(req.body).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === 'string' ? sanitizeInput(value) : value
      }), {});

      // Validate against schema
      const validationResult = await schema.safeParseAsync(sanitizedBody);

      if (!validationResult.success) {
        const errors: ValidationErrorDetail[] = validationResult.error.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          code: 'VALIDATION_ERROR',
          context: {
            resourceType: context.resourceType,
            compliance: context.complianceRequirements
          }
        }));

        throw new ValidationError('Request validation failed', {
          errors,
          securityContext: {
            resourceType: context.resourceType,
            sensitiveData: context.sensitiveFields?.some(field => 
              Object.keys(sanitizedBody).includes(field)
            )
          }
        });
      }

      // Add validated and sanitized data to request
      req.validatedData = validationResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates a validation middleware for query parameters
 * @param schema - Zod schema for validation
 * @param context - Optional validation context
 */
export const validateQueryParams = (
  schema: z.Schema,
  context: Partial<ValidationContext> = {}
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Sanitize query parameters
      const sanitizedQuery = Object.entries(req.query).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === 'string' ? sanitizeInput(value) : value
      }), {});

      // Validate against schema
      const validationResult = await schema.safeParseAsync(sanitizedQuery);

      if (!validationResult.success) {
        const errors: ValidationErrorDetail[] = validationResult.error.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          code: 'QUERY_VALIDATION_ERROR',
          context: {
            resourceType: context.resourceType
          }
        }));

        throw new ValidationError('Query parameter validation failed', { errors });
      }

      // Add validated and sanitized query params to request
      req.validatedQuery = validationResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates a validation middleware for path parameters
 * @param schema - Zod schema for validation
 * @param context - Optional validation context
 */
export const validatePathParams = (
  schema: z.Schema,
  context: Partial<ValidationContext> = {}
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Sanitize path parameters
      const sanitizedParams = Object.entries(req.params).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: sanitizeInput(value)
      }), {});

      // Validate against schema
      const validationResult = await schema.safeParseAsync(sanitizedParams);

      if (!validationResult.success) {
        const errors: ValidationErrorDetail[] = validationResult.error.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          code: 'PATH_VALIDATION_ERROR',
          context: {
            resourceType: context.resourceType
          }
        }));

        throw new ValidationError('Path parameter validation failed', { errors });
      }

      // Add validated and sanitized path params to request
      req.validatedParams = validationResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      validatedQuery?: any;
      validatedParams?: any;
    }
  }
}