/**
 * @fileoverview Enhanced subscription service for Estate Kit platform
 * Implements secure subscription management with Shopify integration
 * @version 1.0.0
 */

import { Service } from 'typedi'; // ^0.10.0
import { Repository } from 'typeorm'; // ^0.3.0
import { RateLimiterMemory } from 'rate-limiter-flexible'; // ^2.4.1
import { Logger } from 'winston';

// Internal imports
import SubscriptionModel from '../db/models/subscription.model';
import { 
  ISubscription, 
  ISubscriptionCreateDTO,
  SubscriptionStatus,
  SubscriptionPlan,
  BillingCycle 
} from '../types/subscription.types';
import { ShopifyIntegration } from '../integrations/shopify.integration';
import { AuditEventType } from '../types/audit.types';

/**
 * Enhanced service class for managing user subscriptions with comprehensive
 * security, audit logging, and compliance features
 */
@Service()
export class SubscriptionService {
  private readonly rateLimiter: RateLimiterMemory;
  private readonly logger: Logger;

  constructor(
    private readonly subscriptionRepository: Repository<SubscriptionModel>,
    private readonly shopifyIntegration: ShopifyIntegration,
    logger: Logger
  ) {
    // Initialize rate limiter for subscription operations
    this.rateLimiter = new RateLimiterMemory({
      points: 100, // Number of operations
      duration: 60, // Per 60 seconds
      blockDuration: 120 // Block for 2 minutes if exceeded
    });

    this.logger = logger;
  }

  /**
   * Creates a new subscription with enhanced security and validation
   * @param createDTO - Subscription creation data
   * @returns Created subscription
   */
  public async createSubscription(
    createDTO: ISubscriptionCreateDTO
  ): Promise<ISubscription> {
    try {
      // Rate limit check
      await this.rateLimiter.consume(createDTO.userId);

      this.logger.info('Creating new subscription', {
        userId: createDTO.userId,
        plan: createDTO.plan
      });

      // Begin transaction
      const queryRunner = this.subscriptionRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create Shopify order
        const shopifyOrder = await this.shopifyIntegration.createOrder({
          customer: {
            email: createDTO.userId, // Assuming userId is email
            firstName: '', // To be populated from user service
            lastName: ''
          },
          lineItems: [{
            productId: this.getPlanProductId(createDTO.plan),
            quantity: 1,
            variantId: this.getPlanVariantId(createDTO.plan, createDTO.billingCycle)
          }],
          billingAddress: {
            address1: 'TBD',
            city: 'TBD',
            province: 'TBD',
            country: 'CA',
            zip: 'TBD'
          }
        });

        // Create subscription record
        const subscription = new SubscriptionModel({
          userId: createDTO.userId,
          plan: createDTO.plan,
          billingCycle: createDTO.billingCycle,
          status: SubscriptionStatus.PENDING,
          startDate: new Date(),
          autoRenew: createDTO.autoRenew,
          shopifySubscriptionId: shopifyOrder.id,
          shopifyCustomerId: createDTO.shopifyCustomerId,
          shopifyOrderIds: [shopifyOrder.id],
          cancelReason: null,
          metadata: {}
        });

        // Validate subscription data
        if (!subscription.validateSubscription()) {
          throw new Error('Invalid subscription data');
        }

        // Log audit event
        subscription.logAuditEvent(
          AuditEventType.SUBSCRIPTION_CHANGE,
          {
            action: 'create',
            plan: createDTO.plan,
            billingCycle: createDTO.billingCycle
          },
          createDTO.userId
        );

        // Save subscription
        const savedSubscription = await queryRunner.manager.save(subscription);

        // Commit transaction
        await queryRunner.commitTransaction();

        this.logger.info('Successfully created subscription', {
          subscriptionId: savedSubscription.id,
          userId: createDTO.userId
        });

        return {
          ...savedSubscription,
          shopifyOrderIds: [shopifyOrder.id],
          cancelReason: null,
          metadata: {}
        };
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Failed to create subscription', {
        error: errorMessage,
        userId: createDTO.userId
      });
      throw error;
    }
  }

  /**
   * Handles Shopify webhooks for subscription events
   * @param webhookEvent - Webhook event data
   */
  public async handleShopifyWebhook(webhookEvent: any): Promise<void> {
    try {
      // Rate limit check
      await this.rateLimiter.consume('webhook');

      const queryRunner = this.subscriptionRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const subscription = await this.subscriptionRepository.findOne({
          where: { shopifySubscriptionId: webhookEvent.payload.id }
        });

        if (!subscription) {
          throw new Error('Subscription not found');
        }

        switch (webhookEvent.topic) {
          case 'orders/paid':
            subscription.status = SubscriptionStatus.ACTIVE;
            subscription.lastBillingDate = new Date();
            break;
          case 'orders/cancelled':
            subscription.status = SubscriptionStatus.CANCELLED;
            subscription.endDate = new Date();
            break;
          case 'orders/failed':
            subscription.status = SubscriptionStatus.PAST_DUE;
            break;
        }

        // Log audit event
        subscription.logAuditEvent(
          AuditEventType.SUBSCRIPTION_CHANGE,
          {
            action: 'webhook',
            topic: webhookEvent.topic,
            status: subscription.status
          },
          'system'
        );

        await queryRunner.manager.save(subscription);
        await queryRunner.commitTransaction();

        this.logger.info('Successfully processed subscription webhook', {
          topic: webhookEvent.topic,
          subscriptionId: subscription.id
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Failed to process subscription webhook', {
        error: errorMessage,
        topic: webhookEvent.topic
      });
      throw error;
    }
  }

  /**
   * Maps subscription plan to Shopify product ID
   * @param plan - Subscription plan
   * @returns Shopify product ID
   * @private
   */
  private getPlanProductId(plan: SubscriptionPlan): string {
    // Implementation would map plans to actual Shopify product IDs
    const productMap: Record<SubscriptionPlan, string> = {
      [SubscriptionPlan.FREE]: 'free-plan-id',
      [SubscriptionPlan.BASIC]: 'basic-plan-id',
      [SubscriptionPlan.PREMIUM]: 'premium-plan-id'
    };
    return productMap[plan];
  }

  /**
   * Maps subscription plan and billing cycle to Shopify variant ID
   * @param plan - Subscription plan
   * @param billingCycle - Billing cycle
   * @returns Shopify variant ID
   * @private
   */
  private getPlanVariantId(plan: SubscriptionPlan, billingCycle: BillingCycle): string {
    // Implementation would map plans and billing cycles to actual Shopify variant IDs
    const variantMap: Record<string, string> = {
      'FREE_MONTHLY': 'free-monthly-id',
      'BASIC_MONTHLY': 'basic-monthly-id',
      'PREMIUM_MONTHLY': 'premium-monthly-id',
      'FREE_ANNUAL': 'free-annual-id',
      'BASIC_ANNUAL': 'basic-annual-id',
      'PREMIUM_ANNUAL': 'premium-annual-id'
    };
    return variantMap[`${plan}_${billingCycle}`];
  }
}