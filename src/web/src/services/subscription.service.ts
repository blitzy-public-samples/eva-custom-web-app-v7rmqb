/**
 * Subscription Service Implementation
 * Version: 1.0.0
 * 
 * Manages user subscriptions and integrates with Shopify e-commerce platform
 * for the Estate Kit application.
 * 
 * @package @shopify/buy-sdk ^2.0.0
 */

import { Client as ShopifyBuy } from '@shopify/buy-sdk';
import { ApiService } from './api.service';
import { 
  ISubscription, 
  ISubscriptionCreateDTO,
  ISubscriptionPlanDetails,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle
} from '../types/subscription.types';

/**
 * Configuration for Shopify client
 */
const SHOPIFY_CONFIG = {
  domain: process.env.VITE_SHOPIFY_DOMAIN || '',
  storefrontAccessToken: process.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '',
  apiVersion: '2024-01' // Latest stable API version
};

/**
 * Service class for managing subscriptions and Shopify integration
 */
export class SubscriptionService {
  private static instance: SubscriptionService;
  private apiService: ApiService;
  private shopifyClient: ShopifyBuy;
  private subscriptionPlansCache: Map<string, ISubscriptionPlanDetails>;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.apiService = ApiService.getInstance();
    this.shopifyClient = ShopifyBuy.buildClient(SHOPIFY_CONFIG);
    this.subscriptionPlansCache = new Map();
  }

  /**
   * Gets singleton instance of SubscriptionService
   */
  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Creates a new subscription with Shopify integration
   */
  public async createSubscription(data: ISubscriptionCreateDTO): Promise<ISubscription> {
    try {
      // Validate subscription data
      this.validateSubscriptionData(data);

      // Create or get Shopify customer
      const shopifyCustomer = await this.getOrCreateShopifyCustomer(data.userId);

      // Create Shopify subscription
      const shopifySubscription = await this.createShopifySubscription({
        customerId: shopifyCustomer.id,
        planId: await this.getShopifyPlanId(data.plan),
        billingCycle: data.billingCycle
      });

      // Create subscription in our backend
      const subscription = await this.apiService.post<ISubscription>('/api/v1/subscriptions', {
        ...data,
        shopifyCustomerId: shopifyCustomer.id,
        shopifySubscriptionId: shopifySubscription.id,
        status: SubscriptionStatus.ACTIVE
      });

      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Updates an existing subscription
   */
  public async updateSubscription(
    subscriptionId: string, 
    updates: Partial<ISubscription>
  ): Promise<ISubscription> {
    try {
      // Update Shopify subscription if plan or billing cycle changed
      if (updates.plan || updates.autoRenew !== undefined) {
        await this.updateShopifySubscription(subscriptionId, updates);
      }

      // Update subscription in our backend
      const updatedSubscription = await this.apiService.put<ISubscription>(
        `/api/v1/subscriptions/${subscriptionId}`,
        updates
      );

      return updatedSubscription;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Cancels an existing subscription
   */
  public async cancelSubscription(subscriptionId: string): Promise<ISubscription> {
    try {
      const subscription = await this.apiService.get<ISubscription>(
        `/api/v1/subscriptions/${subscriptionId}`
      );

      // Cancel Shopify subscription
      await this.shopifyClient.cancelSubscription(subscription.shopifySubscriptionId);

      // Update subscription status in our backend
      return await this.updateSubscription(subscriptionId, {
        status: SubscriptionStatus.CANCELLED,
        endDate: new Date(),
        autoRenew: false
      });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Gets subscription details by ID
   */
  public async getSubscription(subscriptionId: string): Promise<ISubscription> {
    return await this.apiService.get<ISubscription>(
      `/api/v1/subscriptions/${subscriptionId}`
    );
  }

  /**
   * Gets subscription plan details
   */
  public async getSubscriptionPlan(plan: SubscriptionPlan): Promise<ISubscriptionPlanDetails> {
    if (this.subscriptionPlansCache.has(plan)) {
      return this.subscriptionPlansCache.get(plan)!;
    }

    const planDetails = await this.apiService.get<ISubscriptionPlanDetails>(
      `/api/v1/subscription-plans/${plan}`
    );
    
    this.subscriptionPlansCache.set(plan, planDetails);
    return planDetails;
  }

  /**
   * Private helper methods
   */

  private validateSubscriptionData(data: ISubscriptionCreateDTO): void {
    if (!data.userId || !data.plan || !data.billingCycle) {
      throw new Error('Missing required subscription data');
    }

    if (!Object.values(SubscriptionPlan).includes(data.plan)) {
      throw new Error('Invalid subscription plan');
    }

    if (!Object.values(BillingCycle).includes(data.billingCycle)) {
      throw new Error('Invalid billing cycle');
    }
  }

  private async getOrCreateShopifyCustomer(userId: string): Promise<any> {
    try {
      // Try to get existing customer
      const customer = await this.apiService.get(`/api/v1/users/${userId}/shopify-customer`);
      return customer;
    } catch (error) {
      // Create new Shopify customer if not exists
      const userData = await this.apiService.get(`/api/v1/users/${userId}`);
      return await this.shopifyClient.createCustomer({
        email: userData.email,
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ').slice(1).join(' ')
      });
    }
  }

  private async getShopifyPlanId(plan: SubscriptionPlan): Promise<string> {
    const planDetails = await this.getSubscriptionPlan(plan);
    return planDetails.shopifyProductId;
  }

  private async createShopifySubscription(params: {
    customerId: string;
    planId: string;
    billingCycle: BillingCycle;
  }): Promise<any> {
    return await this.shopifyClient.createSubscription({
      customerId: params.customerId,
      productId: params.planId,
      billingCycle: params.billingCycle.toLowerCase(),
      autoRenew: true
    });
  }

  private async updateShopifySubscription(
    subscriptionId: string,
    updates: Partial<ISubscription>
  ): Promise<any> {
    const subscription = await this.getSubscription(subscriptionId);
    
    return await this.shopifyClient.updateSubscription(
      subscription.shopifySubscriptionId,
      {
        productId: updates.plan ? 
          await this.getShopifyPlanId(updates.plan) : 
          undefined,
        autoRenew: updates.autoRenew
      }
    );
  }
}

export default SubscriptionService.getInstance();