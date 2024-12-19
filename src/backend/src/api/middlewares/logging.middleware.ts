/**
 * Estate Kit Logging Middleware
 * Provides request/response logging, correlation ID tracking, and performance monitoring
 * with enhanced security features and CloudWatch integration
 * @module logging.middleware
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.0
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { logger } from '../../../utils/logger.util';

// Security patterns for request/response sanitization
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key'];
const SENSITIVE_BODY_FIELDS = ['password', 'sin', 'creditCard', 'ssn'];

/**
 * Formats request details into structured log entry with PII masking
 */
const formatRequestLog = (req: Request): Record<string, any> => {
  const { method, path, query, headers, body } = req;
  const clientIp = req.ip || req.socket.remoteAddress;

  // Sanitize headers
  const sanitizedHeaders = { ...headers };
  SENSITIVE_HEADERS.forEach(header => {
    if (sanitizedHeaders[header]) {
      sanitizedHeaders[header] = '[REDACTED]';
    }
  });

  // Sanitize request body
  const sanitizedBody = body ? JSON.parse(JSON.stringify(body)) : {};
  SENSITIVE_BODY_FIELDS.forEach(field => {
    if (sanitizedBody[field]) {
      sanitizedBody[field] = '[REDACTED]';
    }
  });

  return {
    type: 'request',
    timestamp: new Date().toISOString(),
    correlationId: headers['x-correlation-id'],
    method,
    path,
    query,
    headers: sanitizedHeaders,
    body: sanitizedBody,
    clientIp,
    userAgent: headers['user-agent'],
    environment: process.env.NODE_ENV
  };
};

/**
 * Formats response details into structured log entry with performance metrics
 */
const formatResponseLog = (res: Response, duration: number): Record<string, any> => {
  const { statusCode, statusMessage } = res;
  const responseSize = res.get('content-length');
  const correlationId = res.get('x-correlation-id');

  // Convert headers to compatible format
  const headers: Record<string, string | number | string[]> = {};
  const rawHeaders = res.getHeaders();
  Object.keys(rawHeaders).forEach(key => {
    const value = rawHeaders[key];
    if (value !== undefined) {
      headers[key] = value;
    }
  });

  const logEntry = {
    type: 'response',
    timestamp: new Date().toISOString(),
    correlationId,
    statusCode,
    statusMessage,
    responseSize,
    duration: {
      microseconds: duration,
      milliseconds: duration / 1000
    },
    headers,
    environment: process.env.NODE_ENV
  };

  // Add error details for non-200 responses
  if (statusCode >= 400) {
    logEntry['error'] = {
      code: statusCode,
      message: statusMessage
    };
  }

  // Add performance metrics
  logEntry['metrics'] = {
    name: 'request_duration',
    value: duration / 1000, // Convert to milliseconds
    unit: 'milliseconds',
    tags: {
      statusCode,
      path: res.req.path,
      method: res.req.method
    }
  };

  return logEntry;
};

/**
 * Express middleware for request/response logging with security and performance monitoring
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate and add correlation ID
  const correlationId = uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  res.set('X-Correlation-ID', correlationId);

  // Start performance timer
  const startTime = process.hrtime();

  // Log request
  logger.info('Incoming request', formatRequestLog(req));

  // Intercept response
  res.on('finish', () => {
    // Calculate request duration in microseconds
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = (seconds * 1e6 + nanoseconds / 1e3);

    // Log response with performance metrics
    const logEntry = formatResponseLog(res, duration);
    
    if (logEntry.statusCode >= 400) {
      logger.error('Request error', logEntry);
    } else {
      logger.info('Request completed', logEntry);
    }

    // Log security events for specific status codes
    if (logEntry.statusCode === 401 || logEntry.statusCode === 403) {
      logger.logSecurityEvent('unauthorized_access', {
        path: req.path,
        method: req.method,
        clientIp: req.ip,
        correlationId
      });
    }
  });

  // Handle errors during request processing
  res.on('error', (error: Error) => {
    logger.error('Request failed', {
      error: {
        message: error.message,
        stack: error.stack
      },
      correlationId,
      path: req.path,
      method: req.method
    });
  });

  next();
};