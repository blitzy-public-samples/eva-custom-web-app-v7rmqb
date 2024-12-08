// @sendgrid/mail v7.7.0
// aws-sdk v2.1360.0
import { logInfo, logError } from '../utils/logger.util';
import { initializeSendGrid, sendEmail } from '../config/sendgrid';
import { initializeSES } from '../config/aws';
import { SES } from 'aws-sdk';

/**
 * Human Tasks:
 * 1. Configure SendGrid API key in environment variables (SENDGRID_API_KEY)
 * 2. Set up AWS SES credentials and verify email addresses/domains
 * 3. Configure email templates in SendGrid dashboard
 * 4. Set up email bounce and spam monitoring
 * 5. Configure email sending limits and quotas
 */

// Interface for email notification data
interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

let sesClient: SES;

/**
 * Initializes both SendGrid and AWS SES clients for sending notifications.
 * Requirement: Email Notifications
 * Location: Technical Specifications/1.3 Scope/In-Scope/Integrations
 */
export const initializeNotificationServices = (): void => {
  try {
    // Initialize SendGrid client
    initializeSendGrid();
    logInfo('SendGrid client initialized successfully');

    // Initialize AWS SES client
    sesClient = initializeSES();
    logInfo('AWS SES client initialized successfully');

    logInfo('All notification services initialized successfully');
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize notification services');
  }
};

/**
 * Sends a notification email using either SendGrid or AWS SES.
 * Requirements:
 * - Email Notifications (Technical Specifications/1.3 Scope/In-Scope/Integrations)
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 * 
 * @param emailData - Object containing email details
 * @param service - Service to use for sending email ('sendgrid' or 'ses')
 * @returns Promise<boolean> indicating if the email was sent successfully
 */
export const sendNotification = async (
  emailData: EmailData,
  service: 'sendgrid' | 'ses'
): Promise<boolean> => {
  try {
    // Validate required email fields
    if (!emailData.to || !emailData.from || !emailData.subject) {
      throw new Error('Missing required email fields');
    }

    // Log the email sending attempt
    logInfo(`Attempting to send email to ${emailData.to} using ${service}`);

    if (service === 'sendgrid') {
      // Send email using SendGrid
      const result = await sendEmail(emailData);
      if (result) {
        logInfo(`Email sent successfully via SendGrid to ${emailData.to}`);
        return true;
      }
      return false;
    } else if (service === 'ses') {
      // Prepare SES parameters
      const params: SES.SendEmailRequest = {
        Destination: {
          ToAddresses: [emailData.to]
        },
        Message: {
          Body: {
            Html: emailData.html ? {
              Charset: 'UTF-8',
              Data: emailData.html
            } : undefined,
            Text: {
              Charset: 'UTF-8',
              Data: emailData.text || ''
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: emailData.subject
          }
        },
        Source: emailData.from,
        ReplyToAddresses: [emailData.from]
      };

      // Send email using AWS SES
      await sesClient.sendEmail(params).promise();
      logInfo(`Email sent successfully via AWS SES to ${emailData.to}`);
      return true;
    } else {
      throw new Error(`Invalid email service specified: ${service}`);
    }
  } catch (error) {
    logError(error as Error);
    return false;
  }
};