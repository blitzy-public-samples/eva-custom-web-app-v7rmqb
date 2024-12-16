/**
 * Subscription Service Implementation
 * Version: 1.0.0
 * 
 * Manages user subscriptions and integrates with Shopify e-commerce platform
 * for the Estate Kit application.
 * 
 * @package shopify-buy ^2.0.0
 */

import Client from 'shopify-buy';
import { apiService } from './api.service';
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
  private shopifyClient: Client;
  private subscriptionPlansCache: Map<string, ISubscriptionPlanDetails>;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.shopifyClient = Client.buildClient(SHOPIFY_CONFIG);
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

      // Create Shopify subscription through API service since Shopify Buy SDK doesn't support it directly
      const shopifySubscription = await apiService.post('/api/v1/shopify/subscriptions', {
        customerId: shopifyCustomer.id,
        planId: await this.getShopifyPlanId(data.plan),
        billingCycle: data.billingCycle,
        autoRenew: true
      });

      // Create subscription in our backend
      const subscription = await apiService.post<ISubscription>('/api/v1/subscriptions', {
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
        await this.updateShopifySubscriptionViaAPI(subscriptionId, updates);
      }

      // Update subscription in our backend
      const updatedSubscription = await apiService.put<ISubscription>(
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
      const subscription = await apiService.get<ISubscription>(
        `/api/v1/subscriptions/${subscriptionId}`
      );

      // Cancel Shopify subscription through API service
      await apiService.post(`/api/v1/shopify/subscriptions/${subscription.shopifySubscriptionId}/cancel`);

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
    return await apiService.get<ISubscription>(
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

    const planDetails = await apiService.get<ISubscriptionPlanDetails>(
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
      const customer = await apiService.get(`/api/v1/users/${userId}/shopify-customer`);
      return customer;
    } catch (error) {
      // Create new Shopify customer through API service
      const userData = await apiService.get<{
        email: string;
        name: string;
      }>(`/api/v1/users/${userId}`);
      
      return await apiService.post('/api/v1/shopify/customers', {
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

  private async updateShopifySubscriptionViaAPI(
    subscriptionId: string,
    updates: Partial<ISubscription>
  ): Promise<any> {
    const subscription = await this.getSubscription(subscriptionId);
    
    return await apiService.put(
      `/api/v1/shopify/subscriptions/${subscription.shopifySubscriptionId}`,
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