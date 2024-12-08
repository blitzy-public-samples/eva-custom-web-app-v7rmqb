// winston v3.8.2
import { Request, Response, NextFunction } from 'express';
import { initializeLogger, logInfo, logError } from '../../../utils/logger.util';

/**
 * Human Tasks:
 * 1. Ensure proper network access for log shipping in production environment
 * 2. Configure request body size limits to prevent logging oversized payloads
 * 3. Set up log redaction rules for sensitive data in headers and request bodies
 * 4. Monitor disk usage when file logging is enabled
 */

/**
 * Express middleware for logging HTTP requests and responses
 * Requirement: Monitoring & Observability - Implements logging mechanisms to capture 
 * application events and errors for debugging and monitoring.
 */
const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Initialize logger
        initializeLogger();

        // Generate request ID for correlation
        const requestId = req.headers['x-request-id'] || 
                         req.headers['x-correlation-id'] || 
                         Math.random().toString(36).substring(7);

        // Log incoming request details
        const requestLog = {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            url: req.originalUrl,
            headers: sanitizeHeaders(req.headers),
            query: req.query,
            clientIp: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        };

        logInfo(`Incoming Request: ${JSON.stringify(requestLog)}`);

        // Capture response using response event listeners
        const startTime = process.hrtime();

        // Override res.end to intercept and log response
        const originalEnd = res.end;
        res.end = function (chunk: any, encoding: BufferEncoding): Response {
            const diff = process.hrtime(startTime);
            const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

            // Log response details
            const responseLog = {
                timestamp: new Date().toISOString(),
                requestId,
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                headers: sanitizeHeaders(res.getHeaders()),
                responseTime: `${responseTime}ms`
            };

            logInfo(`Outgoing Response: ${JSON.stringify(responseLog)}`);

            // Call original end method
            return originalEnd.call(this, chunk, encoding);
        };

        next();
    } catch (error) {
        // Log any errors that occur during the logging process
        logError(error instanceof Error ? error : new Error('Unknown error in logging middleware'));
        next(error);
    }
};

/**
 * Sanitizes headers by removing sensitive information
 * @param headers - Request or response headers
 * @returns Sanitized headers object
 */
const sanitizeHeaders = (headers: any): object => {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
        'authorization',
        'cookie',
        'x-api-key',
        'session',
        'password'
    ];

    for (const header of sensitiveHeaders) {
        if (sanitized[header]) {
            sanitized[header] = '[REDACTED]';
        }
    }

    return sanitized;
};

export default loggingMiddleware;