/**
 * Human Tasks:
 * 1. Ensure error monitoring system is configured to capture and analyze errors
 * 2. Set up alerting thresholds for critical errors
 * 3. Configure error tracking service (e.g., Sentry) integration if needed
 * 4. Review and update error handling policies periodically
 */

// Import the logError function from the logger utility
import { logError } from './logger.util';

/**
 * Formats an error object into a standardized string representation.
 * 
 * Requirement: Monitoring & Observability - Implements error handling mechanisms
 * to capture and log application errors for debugging and monitoring.
 * 
 * @param error - The Error object to be formatted
 * @returns A formatted string representation of the error
 */
export const formatError = (error: Error): string => {
  // If the error has a stack trace, return it as it contains the most detailed information
  if (error.stack) {
    return error.stack;
  }

  // If no stack trace is available, return the error message
  // If the error message is empty or undefined, return a default message
  return error.message || 'An unknown error occurred';
};

/**
 * Handles an error by formatting it and logging it using the logger utility.
 * 
 * Requirement: Monitoring & Observability - Implements error handling mechanisms
 * to capture and log application errors for debugging and monitoring.
 * 
 * @param error - The Error object to be handled
 */
export const handleError = (error: Error): void => {
  // Format the error using the formatError function
  const formattedError = formatError(error);

  // Log the formatted error using the logger utility
  logError(error);

  // Note: The logError function from logger.util.ts already includes:
  // - Timestamp
  // - Error level
  // - Error name
  // - Error message
  // - Stack trace (if available)
  // - JSON formatting for structured logging
};