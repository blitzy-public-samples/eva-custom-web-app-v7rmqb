// @package zod v3.21.4
import { Request, Response, NextFunction } from 'express';
import { validateUserRequest } from '../validators/users.validator';
import { validateSubscriptionData } from '../validators/subscriptions.validator';
import { validateDocumentInput } from '../validators/documents.validator';
import { validateDelegateData } from '../validators/delegates.validator';
import { validateAuthRequest } from '../validators/auth.validator';
import { handleError } from '../../utils/error.util';

/**
 * Human Tasks:
 * 1. Configure error monitoring system to track validation failures
 * 2. Set up rate limiting for API endpoints
 * 3. Review and update validation rules periodically
 * 4. Ensure validation error messages are properly localized
 */

/**
 * Requirement: Data Validation
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Implements validation mechanisms to ensure data integrity and prevent invalid inputs.
 */

/**
 * Middleware function to validate incoming API requests based on their respective schemas.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateRequestMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const path = req.path.toLowerCase();
    const method = req.method.toUpperCase();
    const requestBody = req.body;

    let isValid = false;

    // Determine the type of request and apply appropriate validation
    if (path.includes('/users')) {
      /**
       * Requirement: User Management
       * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
       */
      isValid = validateUserRequest(requestBody);
    } 
    else if (path.includes('/subscriptions')) {
      /**
       * Requirement: Subscription Management
       * Location: Technical Specifications/1.3 Scope/In-Scope/Subscription Management
       */
      isValid = validateSubscriptionData(requestBody);
    }
    else if (path.includes('/documents')) {
      /**
       * Requirement: Document Management
       * Location: Technical Specifications/1.3 Scope/In-Scope/Core Features
       */
      isValid = validateDocumentInput(requestBody);
    }
    else if (path.includes('/delegates')) {
      /**
       * Requirement: Delegate Access Management
       * Location: Technical Specifications/1.3 Scope/In-Scope
       */
      isValid = validateDelegateData(requestBody);
    }
    else if (path.includes('/auth')) {
      /**
       * Requirement: Data Validation
       * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
       */
      isValid = validateAuthRequest(requestBody);
    }
    else {
      // For unrecognized paths, let the request through to be handled by route handlers
      next();
      return;
    }

    if (!isValid) {
      handleError(new Error(`Validation failed for ${method} ${path}`));
      res.status(400).json({
        error: 'Validation Error',
        message: 'The request payload failed validation',
        path: path,
        method: method
      });
      return;
    }

    // If validation passes, proceed to the next middleware/controller
    next();
  } catch (error) {
    // Handle any unexpected errors during validation
    handleError(error as Error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while validating the request'
    });
  }
};