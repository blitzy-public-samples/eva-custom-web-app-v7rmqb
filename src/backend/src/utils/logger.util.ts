// winston v3.8.2
import winston from 'winston';

/**
 * Human Tasks:
 * 1. Ensure LOG_LEVEL environment variable is set in deployment configurations
 * 2. Configure log aggregation service (e.g., CloudWatch) to collect logs
 * 3. Set up log rotation and retention policies in production
 * 4. Configure alert thresholds for error frequency monitoring
 */

// Global log level configuration
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * Formats an error object into a standardized string for logging.
 * Requirement: Monitoring & Observability - Implements consistent error formatting
 * for debugging and monitoring.
 */
const formatError = (error: Error): string => {
  if (error.stack) {
    return error.stack;
  }
  return error.message || 'An unknown error occurred';
};

/**
 * Initializes the Winston logger with predefined configurations.
 * Requirement: Monitoring & Observability - Implements logging mechanisms with
 * appropriate log levels and formatting.
 */
const initializeLogger = (): winston.Logger => {
  return winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'estate-kit-backend' },
    transports: [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      // File transport for production logs
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  });
};

// Initialize the logger instance
const logger = initializeLogger();

/**
 * Logs informational messages using the Winston logger.
 * Requirement: Monitoring & Observability - Captures application events
 * for monitoring and debugging.
 */
const logInfo = (message: string): void => {
  logger.info(message, {
    timestamp: new Date().toISOString(),
    level: 'info'
  });
};

/**
 * Logs warning messages using the Winston logger.
 * Requirement: Monitoring & Observability - Captures application warnings
 * for proactive monitoring.
 */
const logWarning = (message: string): void => {
  logger.warn(message, {
    timestamp: new Date().toISOString(),
    level: 'warn'
  });
};

/**
 * Logs error messages using the Winston logger.
 * Requirement: Monitoring & Observability - Captures application errors
 * for debugging and incident response.
 */
const logError = (error: Error): void => {
  const formattedError = formatError(error);
  logger.error(formattedError, {
    timestamp: new Date().toISOString(),
    level: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
};

export {
  initializeLogger,
  logInfo,
  logWarning,
  logError
};