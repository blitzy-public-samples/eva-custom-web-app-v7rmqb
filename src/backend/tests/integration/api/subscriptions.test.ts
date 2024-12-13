/**
 * @fileoverview Integration tests for subscription-related API endpoints
 * Implements comprehensive test coverage for subscription management and e-commerce integration
 * @version 1.0.0
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'; // ^29.7.0
import supertest from 'supertest'; // ^6.3.3
import nock from 'nock'; // ^13.3.0
import { createHmac } from 'crypto';

// Internal imports
import { SubscriptionsController } from '../../src/api/controllers/subscriptions.controller';
import { mockSubscription, mockSubscriptionCreateDTO, mockSubscriptionScenarios } from '../../mocks/subscription.mock';
import { SubscriptionStatus, SubscriptionPlan, BillingCycle } from '../../src/types/subscription.types';

// Test setup constants
const API_BASE_URL = '/api/v1';
const MOCK_JWT = 'mock.jwt.token';
const MOCK_USER_ID = 'uuid-mock-user-1';
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'test-webhook-secret';

describe('Subscription API Integration Tests', () => {
  let app: any;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    // Initialize test database with isolated schema
    // Set up test application with security middleware
    // Configure Shopify API mocking
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(async () => {
    // Clean up test database
    // Remove test data
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(() => {
    // Reset mocks and test state
    jest.clearAllMocks();
  });

  describe('POST /subscriptions', () => {
    test('should create subscription successfully with audit log', async () => {
      const payload = { ...mockSubscriptionCreateDTO };
      
      // Mock Shopify API call
      nock('https://api.shopify.com')
        .post('/admin/api/2024-01/orders.json')
        .reply(200, { order: { id: 'mock-order-1' } });

      const response = await request
        .post(`${API_BASE_URL}/subscriptions`)
        .set('Authorization', `Bearer ${MOCK_JWT}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        userId: payload.userId,
        plan: payload.plan,
        status: SubscriptionStatus.PENDING,
        billingCycle: payload.billingCycle
      });

      // Verify audit log entry
      expect(response.body.auditLogs).toContainEqual(
        expect.objectContaining({
          eventType: 'SUBSCRIPTION_CHANGE',
          userId: payload.userId,
          details: expect.objectContaining({
            action: 'create',
            plan: payload.plan
          })
        })
      );
    });

    test('should enforce rate limiting on rapid creation attempts', async () => {
      const payload = { ...mockSubscriptionCreateDTO };
      
      // Make multiple rapid requests
      const requests = Array(11).fill(null).map(() => 
        request
          .post(`${API_BASE_URL}/subscriptions`)
          .set('Authorization', `Bearer ${MOCK_JWT}`)
          .send(payload)
      );

      const responses = await Promise.all(requests);
      
      // Verify rate limit enforcement
      expect(responses.some(res => res.status === 429)).toBe(true);
    });

    test('should validate required fields and return 400 for invalid data', async () => {
      const invalidPayload = {
        ...mockSubscriptionCreateDTO,
        plan: 'INVALID_PLAN'
      };

      const response = await request
        .post(`${API_BASE_URL}/subscriptions`)
        .set('Authorization', `Bearer ${MOCK_JWT}`)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: expect.stringContaining('Invalid subscription plan')
      });
    });
  });

  describe('POST /subscriptions/webhook/shopify', () => {
    test('should process valid webhook with signature verification', async () => {
      const webhookPayload = {
        id: 'mock-order-1',
        customer: { email: 'test@example.com' },
        financial_status: 'paid'
      };

      const timestamp = new Date().toISOString();
      const signature = createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
        .update(Buffer.from(JSON.stringify(webhookPayload)))
        .digest('base64');

      const response = await request
        .post(`${API_BASE_URL}/subscriptions/webhook/shopify`)
        .set('X-Shopify-Hmac-SHA256', signature)
        .set('X-Shopify-Topic', 'orders/paid')
        .set('X-Shopify-Shop-Domain', 'test-shop.myshopify.com')
        .set('X-Shopify-Timestamp', timestamp)
        .send(webhookPayload);

      expect(response.status).toBe(200);
    });

    test('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        id: 'mock-order-1',
        customer: { email: 'test@example.com' }
      };

      const response = await request
        .post(`${API_BASE_URL}/subscriptions/webhook/shopify`)
        .set('X-Shopify-Hmac-SHA256', 'invalid-signature')
        .set('X-Shopify-Topic', 'orders/paid')
        .send(webhookPayload);

      expect(response.status).toBe(401);
    });

    test('should handle subscription status updates from webhook', async () => {
      const webhookPayload = {
        id: mockSubscription.shopifySubscriptionId,
        customer: { id: mockSubscription.shopifyCustomerId },
        financial_status: 'paid'
      };

      const signature = createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
        .update(Buffer.from(JSON.stringify(webhookPayload)))
        .digest('base64');

      await request
        .post(`${API_BASE_URL}/subscriptions/webhook/shopify`)
        .set('X-Shopify-Hmac-SHA256', signature)
        .set('X-Shopify-Topic', 'orders/paid')
        .send(webhookPayload);

      // Verify subscription status update
      const updatedSubscription = await request
        .get(`${API_BASE_URL}/subscriptions/${mockSubscription.id}`)
        .set('Authorization', `Bearer ${MOCK_JWT}`);

      expect(updatedSubscription.body.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('PUT /subscriptions/:id', () => {
    test('should update subscription with validation', async () => {
      const updatePayload = {
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: BillingCycle.ANNUAL,
        autoRenew: true
      };

      const response = await request
        .put(`${API_BASE_URL}/subscriptions/${mockSubscription.id}`)
        .set('Authorization', `Bearer ${MOCK_JWT}`)
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: mockSubscription.id,
        plan: updatePayload.plan,
        billingCycle: updatePayload.billingCycle
      });
    });

    test('should prevent invalid status transitions', async () => {
      const invalidUpdate = {
        status: SubscriptionStatus.EXPIRED
      };

      const response = await request
        .put(`${API_BASE_URL}/subscriptions/${mockSubscription.id}`)
        .set('Authorization', `Bearer ${MOCK_JWT}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /subscriptions/:id', () => {
    test('should cancel subscription with audit log', async () => {
      const response = await request
        .delete(`${API_BASE_URL}/subscriptions/${mockSubscription.id}`)
        .set('Authorization', `Bearer ${MOCK_JWT}`);

      expect(response.status).toBe(200);

      // Verify subscription status and audit log
      const cancelledSubscription = await request
        .get(`${API_BASE_URL}/subscriptions/${mockSubscription.id}`)
        .set('Authorization', `Bearer ${MOCK_JWT}`);

      expect(cancelledSubscription.body.status).toBe(SubscriptionStatus.CANCELLED);
      expect(cancelledSubscription.body.auditLogs).toContainEqual(
        expect.objectContaining({
          eventType: 'SUBSCRIPTION_CHANGE',
          details: expect.objectContaining({
            action: 'cancel'
          })
        })
      );
    });
  });
});