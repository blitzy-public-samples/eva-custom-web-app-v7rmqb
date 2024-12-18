/**
 * Estate Kit Logging Utility
 * Provides structured logging with security features, CloudWatch integration, and correlation tracking
 * @module logger
 * @version 1.0.0
 */

import winston from 'winston'; // v3.8.0
import WinstonCloudWatch from 'winston-cloudwatch'; // v3.1.0

// Environment configuration
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV;
const AWS_REGION = process.env.AWS_REGION || 'ca-central-1';
const LOG_GROUP_NAME = process.env.LOG_GROUP_NAME || 'estate-kit-logs';

// Security patterns for PII redaction
const SENSITIVE_PATTERNS = {
  SIN: /\b(\d{3}-\d{3}-\d{3})\b/g,
  EMAIL: /\b[\w\.-]+@[\w\.-]+\.\w+\b/g,
  PHONE: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  CREDIT_CARD: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g
};

/**
 * Formats log messages with enhanced metadata and security features
 */
const formatLogMessage = (info: any): string => {
  const {
    timestamp = new Date().toISOString(),
    level,
    message,
    correlationId,
    securityContext,
    ...metadata
  } = info;

  return JSON.stringify({
    timestamp,
    level,
    message: redactSensitiveData(message),
    correlationId,
    securityContext,
    environment: NODE_ENV,
    service: 'estate-kit',
    ...metadata,
    ...(info.error && {
      error: {
        message: info.error.message,
        stack: info.error.stack,
        code: info.error.code
      }
    })
  });
};

/**
 * Redacts sensitive information from log messages
 */
const redactSensitiveData = (message: string): string => {
  if (typeof message !== 'string') return message;

  let redactedMessage = message;
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    redactedMessage = redactedMessage.replace(pattern, `[REDACTED-${type}]`);
  });
  return redactedMessage;
};

/**
 * Custom logger class with enhanced security and monitoring features
 */
class CustomLogger {
  private winstonLogger: winston.Logger;
  private defaultMeta: Record<string, any>;
  private securityContext: Record<string, any>;
  private readonly bufferConfig: {
    size: number;
    flushInterval: number;
  };

  constructor() {
    this.bufferConfig = {
      size: 100,
      flushInterval: 5000, // 5 seconds
    };

    this.defaultMeta = {
      service: 'estate-kit',
      environment: NODE_ENV,
    };

    this.securityContext = {
      classification: 'INTERNAL',
      compliance: ['PIPEDA', 'HIPAA'],
    };

    // Create Winston logger instance
    this.winstonLogger = winston.createLogger({
      level: LOG_LEVEL,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(formatLogMessage)
      ),
      defaultMeta: this.defaultMeta,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(formatLogMessage)
          )
        })
      ]
    });

    // Add CloudWatch transport in production
    if (NODE_ENV === 'production') {
      try {
        this.winstonLogger.add(new WinstonCloudWatch({
          logGroupName: LOG_GROUP_NAME,
          logStreamName: `${NODE_ENV}-${new Date().toISOString()}`,
          awsRegion: AWS_REGION,
          messageFormatter: formatLogMessage,
          jsonMessage: true,
          bufferSize: this.bufferConfig.size,
          flushInterval: this.bufferConfig.flushInterval
        }));
      } catch (error) {
        console.error('Failed to initialize CloudWatch transport:', error);
        // Fallback to file transport for critical errors
        this.winstonLogger.add(new winston.transports.File({
          filename: 'error.log',
          level: 'error'
        }));
      }
    }
  }

  /**
   * Adds correlation ID to log metadata for request tracing
   */
  public addCorrelationId(correlationId: string): void {
    if (!correlationId || typeof correlationId !== 'string') {
      throw new Error('Invalid correlation ID');
    }
    this.defaultMeta.correlationId = correlationId;
    this.winstonLogger.defaultMeta = this.defaultMeta;
  }

  /**
   * Logs security events with appropriate classification and alerts
   */
  public logSecurityEvent(eventType: string, eventData: Record<string, any>): void {
    const securityEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      classification: this.securityContext.classification,
      compliance: this.securityContext.compliance,
      ...eventData
    };

    this.winstonLogger.warn('Security Event', {
      ...securityEvent,
      message: redactSensitiveData(JSON.stringify(eventData))
    });
  }

  // Standard logging methods with enhanced security
  public error(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.error(redactSensitiveData(message), meta);
  }

  public warn(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.warn(redactSensitiveData(message), meta);
  }

  public info(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.info(redactSensitiveData(message), meta);
  }

  public http(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.http(redactSensitiveData(message), meta);
  }

  public debug(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.debug(redactSensitiveData(message), meta);
  }
}

// Create and export singleton logger instance
const logger = new CustomLogger();

export {
  logger,
  type CustomLogger
};