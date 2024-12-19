/**
 * @file SendGrid Configuration Module
 * @version 1.0.0
 * @description Configuration and type definitions for SendGrid email service integration
 * @module config/sendgrid
 */

// External imports
import dotenv from 'dotenv'; // ^16.0.0
import { config } from '@types/node'; // ^18.0.0

// Initialize environment variables
dotenv.config();

// Global environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || '';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || '';

/**
 * Interface defining the structure of SendGrid email templates
 */
export interface SendGridTemplate {
  id: string;
  subject: string;
  description: string;
}

/**
 * Interface defining the complete SendGrid configuration structure
 */
export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  templates: Record<string, SendGridTemplate>;
  emailDefaults: {
    replyTo: string;
    footer: {
      company: string;
      address: string;
      unsubscribeGroup: number;
    };
    tracking: {
      openTracking: boolean;
      clickTracking: boolean;
      subscriptionTracking: boolean;
    };
  };
}

/**
 * Validates required SendGrid configuration environment variables
 * @throws {Error} If required environment variables are missing
 */
const validateConfig = (): void => {
  const missingVars: string[] = [];

  if (!SENDGRID_API_KEY) missingVars.push('SENDGRID_API_KEY');
  if (!SENDGRID_FROM_EMAIL) missingVars.push('SENDGRID_FROM_EMAIL');
  if (!SENDGRID_FROM_NAME) missingVars.push('SENDGRID_FROM_NAME');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required SendGrid environment variables: ${missingVars.join(', ')}`
    );
  }
};

// Validate configuration on module load
validateConfig();

/**
 * SendGrid configuration object containing all settings and templates
 */
export const sendgridConfig: SendGridConfig = {
  apiKey: SENDGRID_API_KEY,
  fromEmail: SENDGRID_FROM_EMAIL,
  fromName: SENDGRID_FROM_NAME,
  templates: {
    welcome: {
      id: 'd-welcome-template-id',
      subject: 'Welcome to Estate Kit',
      description: 'Welcome email for new user registration'
    },
    delegateInvite: {
      id: 'd-delegate-invite-template-id',
      subject: "You've Been Invited as a Delegate",
      description: 'Invitation email for new delegates'
    },
    documentShared: {
      id: 'd-document-shared-template-id',
      subject: 'Documents Have Been Shared With You',
      description: 'Notification email for shared documents'
    },
    subscriptionUpdate: {
      id: 'd-subscription-update-template-id',
      subject: 'Estate Kit Subscription Update',
      description: 'Subscription status change notification'
    },
    securityAlert: {
      id: 'd-security-alert-template-id',
      subject: 'Security Alert - Estate Kit',
      description: 'Security-related notifications'
    }
  },
  emailDefaults: {
    replyTo: 'support@estatekit.ca',
    footer: {
      company: 'Estate Kit',
      address: 'Canada',
      unsubscribeGroup: 12345
    },
    tracking: {
      openTracking: true,
      clickTracking: true,
      subscriptionTracking: true
    }
  }
};

// Default export for the validated configuration
export default sendgridConfig;