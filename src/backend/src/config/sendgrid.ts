// @sendgrid/mail v7.7.0
import sgMail from '@sendgrid/mail';
import { logInfo, logError } from '../utils/logger.util';
import { validateAuditLog } from '../utils/validation.util';

/**
 * Human Tasks:
 * 1. Set up SendGrid account and obtain API key
 * 2. Configure SENDGRID_API_KEY in environment variables
 * 3. Verify sender email address in SendGrid dashboard
 * 4. Set up email templates in SendGrid for standardized communications
 * 5. Configure email bounce and spam monitoring
 */

// Email template interface for type safety
interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Initializes the SendGrid client with API key
 * Requirement: Email Communications
 * Location: Technical Specifications/1.3 Scope/In-Scope/Integrations
 */
export const initializeSendGrid = (): void => {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    const error = new Error('SendGrid API key not found in environment variables');
    logError(error);
    throw error;
  }

  try {
    sgMail.setApiKey(apiKey);
    logInfo('SendGrid client initialized successfully');
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize SendGrid client');
  }
};

/**
 * Sends an email using SendGrid
 * Requirement: Email Communications, Data Security
 * Location: Technical Specifications/1.3 Scope/In-Scope/Integrations
 * @param emailData - Object containing email details
 * @returns Promise<boolean> - True if email sent successfully, false otherwise
 */
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Create audit log entry for email sending attempt
    const auditLog = {
      id: crypto.randomUUID(),
      userId: 'system',
      action: 'SEND_EMAIL',
      timestamp: new Date(),
      details: {
        recipient: emailData.to,
        subject: emailData.subject,
        templateId: emailData.templateId
      },
      severity: 'INFO',
      status: 'PENDING',
      metadata: {
        component: 'sendgrid',
        environment: process.env.NODE_ENV
      }
    };

    // Validate audit log entry
    if (!validateAuditLog(auditLog)) {
      throw new Error('Invalid audit log entry for email sending');
    }

    // Validate email data
    if (!emailData.to || !emailData.from || !emailData.subject) {
      throw new Error('Missing required email fields');
    }

    // Send email using SendGrid
    await sgMail.send({
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      templateId: emailData.templateId,
      dynamicTemplateData: emailData.dynamicTemplateData,
      trackingSettings: {
        clickTracking: {
          enable: true
        },
        openTracking: {
          enable: true
        }
      }
    });

    // Log successful email sending
    logInfo(`Email sent successfully to ${emailData.to}`);
    return true;

  } catch (error) {
    // Log error and update audit log
    logError(error as Error);
    return false;
  }
};