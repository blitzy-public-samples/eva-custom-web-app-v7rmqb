/**
 * @file Notification Service
 * @version 1.0.0
 * @description Core notification service that orchestrates all types of notifications
 * with event-driven processing using Bull queues and SendGrid integration
 */

import Queue from 'bull'; // v4.10.0
import { SendGridService } from '../integrations/sendgrid.integration';
import { logger } from '../utils/logger.util';

// Queue configuration types
interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  prefix: string;
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
    removeOnComplete: boolean;
    removeOnFail: boolean;
  };
}

// Notification types
type NotificationType = 'welcome' | 'delegate' | 'document' | 'subscription';

interface NotificationJob {
  type: NotificationType;
  data: any;
  priority?: number;
}

/**
 * Service class for managing all types of notifications in the Estate Kit platform
 */
export class NotificationService {
  private readonly sendGridService: SendGridService;
  private readonly notificationQueue: Queue.Queue<NotificationJob>;
  private readonly queueConfig: QueueConfig;

  constructor() {
    this.sendGridService = new SendGridService();

    // Configure queue settings
    this.queueConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      prefix: 'estatekit:notifications',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    };

    // Initialize notification queue
    this.notificationQueue = new Queue<NotificationJob>(
      'notifications',
      {
        redis: this.queueConfig.redis,
        prefix: this.queueConfig.prefix,
        defaultJobOptions: this.queueConfig.defaultJobOptions
      }
    );

    // Set up queue processors
    this.initializeQueueProcessors();

    // Set up error handlers
    this.setupErrorHandlers();

    logger.info('Notification service initialized', {
      queueName: this.notificationQueue.name,
      redisHost: this.queueConfig.redis.host
    });
  }

  /**
   * Sends welcome notification to new users
   */
  public async sendWelcomeNotification(userData: {
    email: string;
    name: string;
    preferences: object;
  }): Promise<void> {
    try {
      await this.notificationQueue.add(
        'welcome',
        {
          type: 'welcome',
          data: {
            email: userData.email,
            firstName: userData.name.split(' ')[0],
            accountType: 'standard'
          }
        },
        {
          priority: 1,
          attempts: 5,
          jobId: `welcome-${userData.email}-${Date.now()}`
        }
      );

      logger.info('Welcome notification queued', {
        email: userData.email,
        type: 'welcome'
      });
    } catch (error) {
      logger.error('Failed to queue welcome notification', {
        error,
        email: userData.email
      });
      throw error;
    }
  }

  /**
   * Sends delegate invitation notification
   */
  public async sendDelegateInviteNotification(inviteData: {
    delegateEmail: string;
    ownerName: string;
    role: string;
    invitationLink: string;
    expiryTime: Date;
  }): Promise<void> {
    try {
      await this.notificationQueue.add(
        'delegate',
        {
          type: 'delegate',
          data: {
            email: inviteData.delegateEmail,
            ownerName: inviteData.ownerName,
            role: inviteData.role,
            inviteUrl: inviteData.invitationLink
          }
        },
        {
          priority: 2,
          attempts: 3,
          jobId: `delegate-${inviteData.delegateEmail}-${Date.now()}`,
          removeOnComplete: true
        }
      );

      logger.info('Delegate invitation notification queued', {
        email: inviteData.delegateEmail,
        role: inviteData.role
      });
    } catch (error) {
      logger.error('Failed to queue delegate invitation', {
        error,
        email: inviteData.delegateEmail
      });
      throw error;
    }
  }

  /**
   * Sends document shared notification
   */
  public async sendDocumentSharedNotification(shareData: {
    recipientEmail: string;
    sharedBy: string;
    documentNames: string[];
    accessUrl: string;
  }): Promise<void> {
    try {
      await this.notificationQueue.add(
        'document',
        {
          type: 'document',
          data: {
            email: shareData.recipientEmail,
            sharedBy: shareData.sharedBy,
            documentNames: shareData.documentNames,
            accessUrl: shareData.accessUrl
          }
        },
        {
          priority: 2,
          attempts: 3,
          jobId: `document-${shareData.recipientEmail}-${Date.now()}`
        }
      );

      logger.info('Document shared notification queued', {
        email: shareData.recipientEmail,
        documents: shareData.documentNames.length
      });
    } catch (error) {
      logger.error('Failed to queue document shared notification', {
        error,
        email: shareData.recipientEmail
      });
      throw error;
    }
  }

  /**
   * Sends subscription-related notifications
   */
  public async sendSubscriptionNotification(subscriptionData: {
    email: string;
    type: 'new' | 'update' | 'cancel';
    details: object;
  }): Promise<void> {
    try {
      await this.notificationQueue.add(
        'subscription',
        {
          type: 'subscription',
          data: {
            email: subscriptionData.email,
            type: subscriptionData.type,
            details: subscriptionData.details
          }
        },
        {
          priority: 3,
          attempts: 3,
          jobId: `subscription-${subscriptionData.email}-${Date.now()}`
        }
      );

      logger.info('Subscription notification queued', {
        email: subscriptionData.email,
        type: subscriptionData.type
      });
    } catch (error) {
      logger.error('Failed to queue subscription notification', {
        error,
        email: subscriptionData.email
      });
      throw error;
    }
  }

  /**
   * Initializes queue processors for different notification types
   */
  private initializeQueueProcessors(): void {
    this.notificationQueue.process('welcome', async (job) => {
      const { data } = job.data;
      await this.sendGridService.sendWelcomeEmail(data.email, {
        firstName: data.firstName,
        accountType: data.accountType
      });
    });

    this.notificationQueue.process('delegate', async (job) => {
      const { data } = job.data;
      await this.sendGridService.sendDelegateInviteEmail(data.email, {
        ownerName: data.ownerName,
        role: data.role,
        inviteUrl: data.inviteUrl
      });
    });

    this.notificationQueue.process('document', async (job) => {
      const { data } = job.data;
      await this.sendGridService.sendDocumentSharedEmail(data.email, {
        sharedBy: data.sharedBy,
        documentNames: data.documentNames,
        accessUrl: data.accessUrl
      });
    });

    this.notificationQueue.process('subscription', async (job) => {
      const { data } = job.data;
      await this.sendGridService.sendSubscriptionEmail(data.email, {
        type: data.type,
        details: data.details
      });
    });
  }

  /**
   * Sets up error handlers for the notification queue
   */
  private setupErrorHandlers(): void {
    this.notificationQueue.on('error', (error) => {
      logger.error('Notification queue error', { error });
    });

    this.notificationQueue.on('failed', (job, error) => {
      logger.error('Notification job failed', {
        jobId: job.id,
        type: job.data.type,
        error,
        attempts: job.attemptsMade
      });
    });

    this.notificationQueue.on('completed', (job) => {
      logger.info('Notification job completed', {
        jobId: job.id,
        type: job.data.type
      });
    });
  }
}