// @sendgrid/mail v7.7.0
import { MailService } from '@sendgrid/mail';

import { logInfo, logError } from '../utils/logger.util';
import { handleError } from '../utils/error.util';
import { initializeSendGrid, sendEmail } from '../config/sendgrid';

/**
 * Human Tasks:
 * 1. Set up SendGrid account and obtain API key
 * 2. Configure SENDGRID_API_KEY in environment variables
 * 3. Verify sender email addresses in SendGrid dashboard
 * 4. Set up email templates in SendGrid for standardized communications
 * 5. Configure email bounce and spam monitoring
 * 6. Set up email event webhooks for tracking delivery status
 */

/**
 * Initializes the SendGrid integration by setting up the client and logging the initialization.
 * 
 * Requirement: Email Communications
 * Location: Technical Specifications/1.3 Scope/In-Scope/Integrations
 * Description: Implements email communication using SendGrid for notifications and alerts.
 */
export const initializeIntegration = (): void => {
  try {
    // Initialize SendGrid client with API key
    initializeSendGrid();
    
    // Log successful initialization
    logInfo('SendGrid integration initialized successfully');
  } catch (error) {
    // Handle and log initialization error
    handleError(error as Error);
    throw new Error('Failed to initialize SendGrid integration');
  }
};

/**
 * Sends a notification email using the SendGrid API.
 * 
 * Requirements:
 * - Email Communications (Technical Specifications/1.3 Scope/In-Scope/Integrations)
 * - Monitoring & Observability (Technical Specifications/2.7 Cross-Cutting Concerns/Monitoring & Observability)
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 * 
 * @param emailData - Object containing email details including recipient, subject, content
 * @returns Promise<boolean> - True if email sent successfully, false otherwise
 */
export const sendNotificationEmail = async (emailData: {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}): Promise<boolean> => {
  try {
    // Log email sending attempt
    logInfo(`Attempting to send notification email to ${emailData.to}`);

    // Send email using SendGrid
    const success = await sendEmail(emailData);

    if (success) {
      // Log successful email sending
      logInfo(`Successfully sent notification email to ${emailData.to}`);
      return true;
    } else {
      // Log email sending failure
      const error = new Error(`Failed to send notification email to ${emailData.to}`);
      handleError(error);
      return false;
    }
  } catch (error) {
    // Handle and log any errors during email sending
    handleError(error as Error);
    logError(error as Error);
    return false;
  }
};