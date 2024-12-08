// intercom-client v2.9.1
import { Client } from 'intercom-client';
import { logInfo, logError } from '../utils/logger.util';
import { sendNotification } from '../services/notification.service';

/**
 * Human Tasks:
 * 1. Set up Intercom account and obtain access token
 * 2. Configure INTERCOM_ACCESS_TOKEN in environment variables
 * 3. Set up Intercom workspace and configure initial settings
 * 4. Define custom attributes in Intercom for user data synchronization
 * 5. Configure webhook endpoints for Intercom events if needed
 */

// Validate required environment variables
if (!process.env.INTERCOM_ACCESS_TOKEN) {
  throw new Error('Missing required environment variable: INTERCOM_ACCESS_TOKEN');
}

let intercomClient: Client;

/**
 * Initializes the Intercom client with the access token.
 * Requirement: Customer Support Integration
 * Location: Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 * 
 * @returns An instance of the Intercom client
 */
export const initializeIntercom = (): Client => {
  try {
    intercomClient = new Client({
      tokenAuth: {
        token: process.env.INTERCOM_ACCESS_TOKEN
      }
    });

    logInfo('Intercom client initialized successfully');
    return intercomClient;
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize Intercom client');
  }
};

/**
 * Sends a custom event to Intercom for tracking user actions.
 * Requirement: Customer Support Integration
 * Location: Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 * 
 * @param userId - The ID of the user who performed the action
 * @param eventName - The name of the event to track
 * @param metadata - Additional data associated with the event
 * @returns Promise<boolean> indicating if the event was sent successfully
 */
export const sendEvent = async (
  userId: string,
  eventName: string,
  metadata: Record<string, any>
): Promise<boolean> => {
  try {
    // Validate input parameters
    if (!userId || !eventName) {
      throw new Error('Missing required parameters: userId or eventName');
    }

    // Ensure Intercom client is initialized
    if (!intercomClient) {
      intercomClient = initializeIntercom();
    }

    // Send event to Intercom
    await intercomClient.events.create({
      event_name: eventName,
      created_at: Math.floor(Date.now() / 1000),
      user_id: userId,
      metadata
    });

    logInfo(`Intercom event "${eventName}" sent successfully for user ${userId}`);

    // Send notification about the event if needed
    await sendNotification({
      to: userId,
      subject: 'Activity Tracked',
      text: `Your activity "${eventName}" has been recorded.`
    }, 'sendgrid');

    return true;
  } catch (error) {
    logError(error as Error);
    return false;
  }
};

/**
 * Synchronizes user data with Intercom.
 * Requirement: Customer Support Integration
 * Location: Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 * 
 * @param userData - Object containing user data to synchronize
 * @returns Promise<boolean> indicating if the data was synchronized successfully
 */
export const syncUserData = async (
  userData: {
    id: string;
    email: string;
    name?: string;
    customAttributes?: Record<string, any>;
  }
): Promise<boolean> => {
  try {
    // Validate userData structure
    if (!userData.id || !userData.email) {
      throw new Error('Missing required user data: id or email');
    }

    // Ensure Intercom client is initialized
    if (!intercomClient) {
      intercomClient = initializeIntercom();
    }

    // Prepare user data for Intercom
    const intercomUser = {
      user_id: userData.id,
      email: userData.email,
      name: userData.name,
      custom_attributes: userData.customAttributes,
      signed_up_at: Math.floor(Date.now() / 1000)
    };

    // Update or create user in Intercom
    await intercomClient.users.create(intercomUser);

    logInfo(`User data synchronized successfully with Intercom for user ${userData.id}`);
    return true;
  } catch (error) {
    logError(error as Error);
    return false;
  }
};