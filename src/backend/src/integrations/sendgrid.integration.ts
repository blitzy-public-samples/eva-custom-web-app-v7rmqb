/**
 * @file SendGrid Integration Service
 * @version 1.0.0
 * @description Handles all email communications for Estate Kit platform using SendGrid's API
 * with comprehensive security, monitoring, and reliability features
 */

import sgMail from '@sendgrid/mail'; // v7.7.0
import { sendgridConfig } from '../config/sendgrid';
import { logger } from '../utils/logger.util';
import { RateLimiter } from 'limiter'; // v2.0.0
import { validate as validateEmail } from 'email-validator'; // v2.0.4

/**
 * Interface for email template data
 */
interface EmailTemplateData {
  [key: string]: string | number | boolean | object;
}

/**
 * Interface for email sending options
 */
interface EmailOptions {
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
  categories?: string[];
  customArgs?: { [key: string]: string };
  sendAt?: number;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Service class for handling all email communications through SendGrid
 */
export class SendGridService {
  private sgMail: typeof sgMail;
  private config: typeof sendgridConfig;
  private rateLimiter: RateLimiter;
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // Base delay in ms

  constructor() {
    this.config = sendgridConfig;
    this.sgMail = sgMail;
    this.sgMail.setApiKey(this.config.apiKey);

    // Initialize rate limiter (100 emails per minute)
    this.rateLimiter = new RateLimiter(100, 'minute');

    // Log initialization
    logger.info('SendGrid service initialized', {
      fromEmail: this.config.fromEmail,
      templates: Object.keys(this.config.templates)
    });
  }

  /**
   * Sends an email using SendGrid's API with comprehensive error handling
   */
  public async sendEmail(
    templateId: string,
    toEmail: string,
    templateData: EmailTemplateData,
    options: EmailOptions = {}
  ): Promise<void> {
    try {
      // Rate limit check
      const hasCapacity = await this.rateLimiter.tryRemoveTokens(1);
      if (!hasCapacity) {
        throw new Error('Rate limit exceeded for email sending');
      }

      // Validate email format
      if (!validateEmail(toEmail)) {
        throw new Error(`Invalid email format: ${toEmail}`);
      }

      // Validate template exists
      if (!Object.values(this.config.templates).find(t => t.id === templateId)) {
        throw new Error(`Invalid template ID: ${templateId}`);
      }

      // Construct email message
      const msg = {
        to: toEmail,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        templateId,
        dynamicTemplateData: {
          ...templateData,
          company: this.config.emailDefaults.footer.company,
          unsubscribeGroup: this.config.emailDefaults.footer.unsubscribeGroup
        },
        ...options,
        headers: {
          'X-Estate-Kit-Sender': 'system',
          'X-Estate-Kit-Template': templateId,
          ...options.customArgs
        },
        trackingSettings: {
          openTracking: { enable: this.config.emailDefaults.tracking.openTracking },
          clickTracking: { enable: this.config.emailDefaults.tracking.clickTracking },
          subscriptionTracking: { enable: this.config.emailDefaults.tracking.subscriptionTracking }
        }
      };

      // Send email with retry logic
      await this.sendWithRetry(msg);

      // Log success
      logger.info('Email sent successfully', {
        template: templateId,
        recipient: toEmail
      });

    } catch (error) {
      logger.error('Failed to send email', {
        error,
        template: templateId,
        recipient: toEmail
      });
      throw error;
    }
  }

  /**
   * Sends welcome email to new users
   */
  public async sendWelcomeEmail(
    toEmail: string,
    userData: { firstName: string; accountType: string }
  ): Promise<void> {
    await this.sendEmail(
      this.config.templates.welcome.id,
      toEmail,
      {
        firstName: userData.firstName,
        accountType: userData.accountType,
        loginUrl: process.env.APP_URL + '/login'
      }
    );
  }

  /**
   * Sends delegate invitation email
   */
  public async sendDelegateInviteEmail(
    toEmail: string,
    inviteData: { ownerName: string; role: string; inviteUrl: string }
  ): Promise<void> {
    await this.sendEmail(
      this.config.templates.delegateInvite.id,
      toEmail,
      {
        ownerName: inviteData.ownerName,
        role: inviteData.role,
        inviteUrl: inviteData.inviteUrl,
        expiryHours: 48
      }
    );
  }

  /**
   * Sends document shared notification email
   */
  public async sendDocumentSharedEmail(
    toEmail: string,
    shareData: { sharedBy: string; documentNames: string[]; accessUrl: string }
  ): Promise<void> {
    await this.sendEmail(
      this.config.templates.documentShared.id,
      toEmail,
      {
        sharedBy: shareData.sharedBy,
        documentCount: shareData.documentNames.length,
        documentList: shareData.documentNames.join(', '),
        accessUrl: shareData.accessUrl
      }
    );
  }

  /**
   * Sends subscription-related emails
   */
  public async sendSubscriptionEmail(
    toEmail: string,
    subscriptionData: { type: 'new' | 'update' | 'cancel'; details: object }
  ): Promise<void> {
    await this.sendEmail(
      this.config.templates.subscriptionUpdate.id,
      toEmail,
      {
        type: subscriptionData.type,
        ...subscriptionData.details
      }
    );
  }

  /**
   * Helper method to implement retry logic with exponential backoff
   */
  private async sendWithRetry(msg: any, attempt = 1): Promise<void> {
    try {
      await this.sgMail.send(msg);
    } catch (error) {
      if (attempt >= this.retryAttempts) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      
      logger.warn(`Retry attempt ${attempt} for email sending`, {
        recipient: msg.to,
        template: msg.templateId,
        delay
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.sendWithRetry(msg, attempt + 1);
    }
  }
}