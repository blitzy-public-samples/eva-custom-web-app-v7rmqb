// @package supertest v6.3.3
// @package jest v29.6.2
import request from 'supertest';
import { 
  createSubscriptionHandler, 
  updateSubscriptionHandler, 
  getUserSubscriptionsHandler 
} from '../../../src/api/controllers/subscriptions.controller';
import { 
  createSubscription, 
  updateSubscription, 
  getUserSubscriptions 
} from '../../../src/services/subscription.service';
import { validateSubscriptionData } from '../../../src/api/validators/subscriptions.validator';
import { SubscriptionModel } from '../../../src/db/models/subscription.model';
import { initializeDatabase } from '../../../src/config/database';
import { validateUserSubscription } from '../../../src/utils/validation.util';
import { logInfo, logError } from '../../../src/utils/logger.util';

/**
 * Human Tasks:
 * 1. Ensure test database is properly configured and isolated from production
 * 2. Verify that test data cleanup is properly implemented
 * 3. Configure test environment variables for database connection
 * 4. Set up test coverage monitoring for subscription-related tests
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test data
const testUserId = '12345678-1234-1234-1234-123456789012';
const testSubscriptionId = '87654321-4321-4321-4321-210987654321';
const validSubscriptionData = {
  userId: testUserId,
  planId: 'premium-monthly',
  status: 'active',
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
};

describe('Subscription API Integration Tests', () => {
  let db: any;

  beforeAll(async () => {
    // Initialize database connection
    db = await initializeDatabase();
    logInfo('Test database connection initialized');
  });

  afterAll(async () => {
    // Clean up database connection
    await db.end();
    logInfo('Test database connection closed');
  });

  beforeEach(async () => {
    // Clear test data before each test
    await SubscriptionModel.destroy({ where: {} });
    logInfo('Test data cleared');
  });

  /**
   * Tests the API endpoint for creating a new subscription.
   * Requirements Addressed:
   * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
   */
  describe('POST /subscriptions', () => {
    it('should create a new subscription with valid data', async () => {
      try {
        const response = await request(API_BASE_URL)
          .post('/subscriptions')
          .send(validSubscriptionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('subscriptionId');
        expect(response.body.data.userId).toBe(testUserId);
        expect(response.body.data.status).toBe('active');

        logInfo(`Test passed: Create subscription with valid data`);
      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });

    it('should reject subscription creation with invalid data', async () => {
      try {
        const invalidData = {
          ...validSubscriptionData,
          planId: '' // Invalid: empty plan ID
        };

        const response = await request(API_BASE_URL)
          .post('/subscriptions')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid subscription data');

        logInfo(`Test passed: Reject invalid subscription data`);
      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });
  });

  /**
   * Tests the API endpoint for updating an existing subscription.
   * Requirements Addressed:
   * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
   */
  describe('PUT /subscriptions/:subscriptionId', () => {
    beforeEach(async () => {
      // Create a test subscription
      await SubscriptionModel.create({
        subscriptionId: testSubscriptionId,
        ...validSubscriptionData
      });
    });

    it('should update subscription status with valid data', async () => {
      try {
        const updateData = {
          status: 'inactive'
        };

        const response = await request(API_BASE_URL)
          .put(`/subscriptions/${testSubscriptionId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Subscription updated successfully');

        // Verify database update
        const updatedSubscription = await SubscriptionModel.findByPk(testSubscriptionId);
        expect(updatedSubscription?.status).toBe('inactive');

        logInfo(`Test passed: Update subscription status`);
      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });

    it('should reject update with invalid status', async () => {
      try {
        const invalidData = {
          status: 'invalid_status'
        };

        const response = await request(API_BASE_URL)
          .put(`/subscriptions/${testSubscriptionId}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid subscription status');

        logInfo(`Test passed: Reject invalid status update`);
      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });
  });

  /**
   * Tests the API endpoint for retrieving user subscriptions.
   * Requirements Addressed:
   * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
   */
  describe('GET /subscriptions/user/:userId', () => {
    beforeEach(async () => {
      // Create test subscriptions for the user
      await SubscriptionModel.create({
        subscriptionId: testSubscriptionId,
        ...validSubscriptionData
      });
    });

    it('should retrieve all subscriptions for a user', async () => {
      try {
        const response = await request(API_BASE_URL)
          .get(`/subscriptions/user/${testUserId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].userId).toBe(testUserId);

        logInfo(`Test passed: Retrieve user subscriptions`);
      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });

    it('should return empty array for user with no subscriptions', async () => {
      try {
        const nonExistentUserId = '99999999-9999-9999-9999-999999999999';

        const response = await request(API_BASE_URL)
          .get(`/subscriptions/user/${nonExistentUserId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(0);

        logInfo(`Test passed: Handle user with no subscriptions`);
      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });
  });
});