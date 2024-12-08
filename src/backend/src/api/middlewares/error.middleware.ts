// express v4.18.2
import { Request, Response, NextFunction } from 'express';
import { logError } from '../../utils/logger.util';
import { formatError } from '../../utils/error.util';

/**
 * Human Tasks:
 * 1. Ensure error monitoring system is properly configured in production
 * 2. Set up alerts for error thresholds in monitoring system
 * 3. Configure error tracking service integration if needed
 * 4. Review error response format with frontend team
 * 5. Define custom error types and status codes for specific business cases
 */

/**
 * Express middleware for handling errors in the API.
 * 
 * Requirement: Monitoring & Observability - Implements error handling mechanisms
 * to capture and log application errors for debugging and monitoring.
 * 
 * @param err - The error object thrown in the application
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error using the logger utility
  logError(err);

  // Format the error message
  const formattedError = formatError(err);

  // Determine the HTTP status code
  // If the error has a status property, use it; otherwise default to 500
  const statusCode = (err as any).status || (err as any).statusCode || 500;

  // Prepare the error response object
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred',
      status: statusCode,
      // Only include stack trace in development environment
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    // Include request information for debugging
    request: {
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    }
  };

  // Send the error response
  res.status(statusCode).json(errorResponse);

  // Call next to ensure the middleware chain is complete
  next();
};