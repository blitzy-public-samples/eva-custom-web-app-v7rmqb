// intercom-client v2.9.1
import { initializeIntercom, sendEvent, syncUserData } from '../config/intercom';
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

/**
 * Initializes the Intercom integration by setting up the client and logging the initialization.
 * Requirement: Customer Support Integration
 * Location: Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 */
export const initializeIntegration = (): void => {
  try {
    initializeIntercom();
    logInfo('Intercom integration initialized successfully');
  } catch (error) {
    logError(error as Error);
    throw new Error('Failed to initialize Intercom integration');
  }
};

/**
 * Tracks a user event in Intercom by sending a custom event.
 * Requirement: Customer Support Integration
 * Location: Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 * 
 * @param userId - The ID of the user who performed the action
 * @param eventName - The name of the event to track
 * @param metadata - Additional data associated with the event
 * @returns boolean indicating if the event was sent successfully
 */
export const trackUserEvent = async (
  userId: string,
  eventName: string,
  metadata: Record<string, any>
): Promise<boolean> => {
  try {
    // Validate input parameters
    if (!userId || !eventName) {
      throw new Error('Missing required parameters: userId or eventName');
    }

    // Send event to Intercom
    const eventSent = await sendEvent(userId, eventName, metadata);
    if (eventSent) {
      logInfo(`Intercom event "${eventName}" tracked successfully for user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    logError(error as Error);
    return false;
  }
};

/**
 * Updates user data in Intercom by synchronizing the provided user data.
 * Requirement: Customer Support Integration
 * Location: Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 * 
 * @param userData - Object containing user data to synchronize
 * @returns boolean indicating if the user data was updated successfully
 */
export const updateUserData = async (
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

    // Sync user data with Intercom
    const syncResult = await syncUserData(userData);
    if (syncResult) {
      logInfo(`User data synchronized successfully with Intercom for user ${userData.id}`);
      return true;
    }
    return false;
  } catch (error) {
    logError(error as Error);
    return false;
  }
};

/**
 * Sends a notification to a user about an Intercom-related activity.
 * Requirement: Customer Support Integration
 * Location: Technical Specifications/1.2 System Overview/High-Level Description/Integrations
 * 
 * @param notificationData - Object containing notification details
 * @returns boolean indicating if the notification was sent successfully
 */
export const notifyUser = async (
  notificationData: {
    to: string;
    subject: string;
    text: string;
    type?: string;
  }
): Promise<boolean> => {
  try {
    // Validate notification data
    if (!notificationData.to || !notificationData.subject || !notificationData.text) {
      throw new Error('Missing required notification data');
    }

    // Send notification
    await sendNotification({
      to: notificationData.to,
      subject: notificationData.subject,
      text: notificationData.text,
      type: notificationData.type || 'intercom'
    }, 'sendgrid');

    logInfo(`Intercom-related notification sent successfully to user ${notificationData.to}`);
    return true;
  } catch (error) {
    logError(error as Error);
    return false;
  }
};