/**
 * Intercom Integration Service
 * Provides secure customer support platform integration with enhanced monitoring
 * and PIPEDA/HIPAA compliance features.
 * @version 1.0.0
 */

import { Client } from 'intercom-client'; // v4.0.0
import { logger } from '../utils/logger.util';
import { createIntercomClient } from '../config/intercom';
import { ValidationError } from '../utils/error.util';
import { AuditEventType, AuditSeverity } from '../types/audit.types';

// Type definitions for Intercom operations
interface UserData {
  userId: string;
  email: string;
  name?: string;
  customAttributes?: Record<string, any>;
}

interface ConversationData {
  message: string;
  messageType: 'comment' | 'note';
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  attachments?: Array<{ url: string; type: string }>;
}

interface EventMetadata {
  createdAt?: number;
  metadata?: Record<string, any>;
}

interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

/**
 * Service class for managing secure Intercom customer support operations
 * with enhanced monitoring and PIPEDA compliance
 */
export class IntercomService {
  private readonly client: Client;
  private readonly config: {
    maxRetries: number;
    rateLimitWindow: number;
    maxRequestsPerWindow: number;
    securityRules: {
      requireUserValidation: boolean;
      maxAttachmentSize: number;
      allowedAttachmentTypes: string[];
      sensitiveDataPatterns: RegExp[];
    };
  };

  constructor() {
    // Initialize Intercom client with secure configuration
    this.client = createIntercomClient({
      requestTimeout: 30000,
      maxRetries: 3,
      enableLogging: true,
      logLevel: 'info'
    });

    // Configure security and operational parameters
    this.config = {
      maxRetries: 3,
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 500,
      securityRules: {
        requireUserValidation: true,
        maxAttachmentSize: 20 * 1024 * 1024, // 20MB
        allowedAttachmentTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        sensitiveDataPatterns: [
          /\b\d{3}-\d{3}-\d{3}\b/, // SIN
          /\b\d{16}\b/, // Credit card
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ // Email
        ]
      }
    };

    logger.info('Intercom service initialized with secure configuration');
  }

  /**
   * Securely creates or updates a user in Intercom with audit logging
   */
  public async createOrUpdateUser(userData: UserData): Promise<any> {
    try {
      // Validate user data
      const validationResult = await this.validateIntercomPayload(userData, 'user');
      if (!validationResult.isValid) {
        throw new ValidationError('Invalid user data', { errors: validationResult.errors });
      }

      // Sanitize user data before sending to Intercom
      const sanitizedData = this.sanitizeUserData(userData);

      // Log security event for user operation
      logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
        userId: userData.userId,
        action: 'intercom_user_update',
        severity: AuditSeverity.INFO
      });

      // Create or update user in Intercom
      const response = await this.client.contacts.create({
        user_id: sanitizedData.userId,
        email: sanitizedData.email,
        name: sanitizedData.name,
        custom_attributes: sanitizedData.customAttributes
      });

      logger.info('Successfully created/updated Intercom user', {
        userId: userData.userId,
        operation: 'createOrUpdateUser'
      });

      return response;
    } catch (error) {
      logger.error('Failed to create/update Intercom user', {
        error,
        userId: userData.userId
      });
      throw error;
    }
  }

  /**
   * Creates a new conversation/ticket in Intercom with security monitoring
   */
  public async createConversation(userId: string, conversationData: ConversationData): Promise<any> {
    try {
      // Validate conversation data
      const validationResult = await this.validateIntercomPayload(conversationData, 'conversation');
      if (!validationResult.isValid) {
        throw new ValidationError('Invalid conversation data', { errors: validationResult.errors });
      }

      // Check for sensitive data in message
      if (this.containsSensitiveData(conversationData.message)) {
        logger.warn('Sensitive data detected in conversation', {
          userId,
          severity: AuditSeverity.WARNING
        });
      }

      // Create conversation in Intercom
      const response = await this.client.messages.create({
        from: {
          type: 'contact',
          id: userId
        },
        body: conversationData.message,
        message_type: conversationData.messageType,
        priority: conversationData.priority
      });

      logger.info('Successfully created Intercom conversation', {
        userId,
        conversationId: response.id
      });

      return response;
    } catch (error) {
      logger.error('Failed to create Intercom conversation', {
        error,
        userId
      });
      throw error;
    }
  }

  /**
   * Securely tracks a user event in Intercom with monitoring
   */
  public async trackEvent(userId: string, eventName: string, metadata?: EventMetadata): Promise<void> {
    try {
      // Validate event data
      const validationResult = await this.validateIntercomPayload({ userId, eventName, metadata }, 'event');
      if (!validationResult.isValid) {
        throw new ValidationError('Invalid event data', { errors: validationResult.errors });
      }

      // Track event in Intercom
      await this.client.events.create({
        eventName: eventName,
        user_id: userId,
        created_at: metadata?.createdAt || Math.floor(Date.now() / 1000),
        metadata: metadata?.metadata
      });

      logger.info('Successfully tracked Intercom event', {
        userId,
        eventName
      });
    } catch (error) {
      logger.error('Failed to track Intercom event', {
        error,
        userId,
        eventName
      });
      throw error;
    }
  }

  /**
   * Validates payload for Intercom operations with security checks
   */
  private async validateIntercomPayload(
    payload: any,
    operationType: 'user' | 'conversation' | 'event'
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    switch (operationType) {
      case 'user':
        if (!payload.userId || !payload.email) {
          errors.push('Missing required user fields');
        }
        if (payload.email && !this.isValidEmail(payload.email)) {
          errors.push('Invalid email format');
        }
        break;

      case 'conversation':
        if (!payload.message || !payload.messageType) {
          errors.push('Missing required conversation fields');
        }
        if (payload.attachments) {
          this.validateAttachments(payload.attachments, errors);
        }
        break;

      case 'event':
        if (!payload.userId || !payload.eventName) {
          errors.push('Missing required event fields');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Sanitizes user data to remove sensitive information
   */
  private sanitizeUserData(userData: UserData): UserData {
    const sanitized = { ...userData };
    
    // Remove sensitive fields from custom attributes
    if (sanitized.customAttributes) {
      const sensitiveFields = ['password', 'sin', 'ssn', 'creditCard'];
      sensitiveFields.forEach(field => {
        if (field in sanitized.customAttributes!) {
          delete sanitized.customAttributes![field];
        }
      });
    }

    return sanitized;
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validates attachments for security and compliance
   */
  private validateAttachments(
    attachments: Array<{ url: string; type: string }>,
    errors: string[]
  ): void {
    attachments.forEach(attachment => {
      if (!this.config.securityRules.allowedAttachmentTypes.includes(attachment.type)) {
        errors.push(`Unsupported attachment type: ${attachment.type}`);
      }
    });
  }

  /**
   * Checks for sensitive data patterns in content
   */
  private containsSensitiveData(content: string): boolean {
    return this.config.securityRules.sensitiveDataPatterns.some(pattern => 
      pattern.test(content)
    );
  }
}

// Export validation utility for external use
export const validateIntercomPayload = async (
  payload: any,
  operationType: 'user' | 'conversation' | 'event'
): Promise<ValidationResult> => {
  const service = new IntercomService();
  return service['validateIntercomPayload'](payload, operationType);
};