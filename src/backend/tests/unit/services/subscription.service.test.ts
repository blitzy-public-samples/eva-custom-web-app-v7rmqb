// @package jest v29.0.0
// @package zod v3.21.4

import { 
  createSubscription, 
  updateSubscription, 
  getUserSubscriptions 
} from '../../src/services/subscription.service';
import { UserSubscription } from '../../src/types/subscription.types';
import { validateUserSubscription } from '../../src/utils/validation.util';
import { logInfo, logError } from '../../src/utils/logger.util';

// Mock the imported modules
jest.mock('../../src/utils/validation.util');
jest.mock('../../src/utils/logger.util');
jest.mock('../../src/db/models/subscription.model', () => ({
  create: jest.fn(),
  updateSubscriptionStatus: jest.fn(),
  findByUserId: jest.fn()
}));
jest.mock('../../src/config/auth0', () => ({
  initializeAuth0: jest.fn()
}));
jest.mock('../../src/config/aws', () => ({
  initializeS3: jest.fn()
}));

/**
 * Human Tasks:
 * 1. Ensure test database is properly configured and isolated from production
 * 2. Verify that mock data matches the expected schema in production
 * 3. Configure test coverage thresholds in Jest configuration
 * 4. Set up continuous integration to run tests automatically
 */

describe('Subscription Service Tests', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test suite for createSubscription function
   * Requirements Addressed:
   * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
   *   Tests the creation of new subscriptions with validation
   */
  describe('createSubscription', () => {
    const mockSubscriptionData: UserSubscription = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      planId: '987fcdeb-51a2-43d7-9876-543210987654',
      status: 'inactive',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    it('should create a subscription successfully when data is valid', async () => {
      // Mock successful validation
      (validateUserSubscription as jest.Mock).mockReturnValue(true);

      // Mock successful subscription creation
      const mockCreatedSubscription = { ...mockSubscriptionData, subscriptionId: '12345' };
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.create.mockResolvedValue(mockCreatedSubscription);

      const result = await createSubscription(mockSubscriptionData);

      expect(validateUserSubscription).toHaveBeenCalledWith(mockSubscriptionData);
      expect(logInfo).toHaveBeenCalledWith(`Creating subscription for user: ${mockSubscriptionData.userId}`);
      expect(result).toEqual(mockCreatedSubscription);
      expect(logInfo).toHaveBeenCalledWith(`Subscription created successfully: ${mockCreatedSubscription.subscriptionId}`);
    });

    it('should throw error when validation fails', async () => {
      // Mock failed validation
      (validateUserSubscription as jest.Mock).mockReturnValue(false);

      await expect(createSubscription(mockSubscriptionData))
        .rejects
        .toThrow('Failed to create subscription');

      expect(validateUserSubscription).toHaveBeenCalledWith(mockSubscriptionData);
      expect(logError).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock successful validation but failed creation
      (validateUserSubscription as jest.Mock).mockReturnValue(true);
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.create.mockRejectedValue(new Error('Database error'));

      await expect(createSubscription(mockSubscriptionData))
        .rejects
        .toThrow('Failed to create subscription');

      expect(logError).toHaveBeenCalled();
    });
  });

  /**
   * Test suite for updateSubscription function
   * Requirements Addressed:
   * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
   *   Tests the update functionality for subscription statuses
   */
  describe('updateSubscription', () => {
    const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';
    const newStatus = 'active' as const;

    it('should update subscription status successfully', async () => {
      // Mock successful status update
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.updateSubscriptionStatus.mockResolvedValue(true);

      const result = await updateSubscription(subscriptionId, newStatus);

      expect(result).toBe(true);
      expect(logInfo).toHaveBeenCalledWith(`Updating subscription status: ${subscriptionId} to ${newStatus}`);
      expect(logInfo).toHaveBeenCalledWith(`Subscription status updated successfully: ${subscriptionId}`);
    });

    it('should handle failed status updates', async () => {
      // Mock failed status update
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.updateSubscriptionStatus.mockResolvedValue(false);

      const result = await updateSubscription(subscriptionId, newStatus);

      expect(result).toBe(false);
      expect(logError).toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      // Mock database error
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.updateSubscriptionStatus.mockRejectedValue(new Error('Database error'));

      const result = await updateSubscription(subscriptionId, newStatus);

      expect(result).toBe(false);
      expect(logError).toHaveBeenCalled();
    });
  });

  /**
   * Test suite for getUserSubscriptions function
   * Requirements Addressed:
   * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/Subscription Management)
   *   Tests the retrieval of user subscriptions
   */
  describe('getUserSubscriptions', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const mockSubscriptions = [
      {
        subscriptionId: '12345',
        userId,
        planId: '987fcdeb-51a2-43d7-9876-543210987654',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ];

    it('should retrieve user subscriptions successfully', async () => {
      // Mock successful subscription retrieval
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.findByUserId.mockResolvedValue(mockSubscriptions);

      const result = await getUserSubscriptions(userId);

      expect(result).toEqual(mockSubscriptions);
      expect(logInfo).toHaveBeenCalledWith(`Retrieving subscriptions for user: ${userId}`);
      expect(logInfo).toHaveBeenCalledWith(`Retrieved ${mockSubscriptions.length} subscriptions for user: ${userId}`);
    });

    it('should handle empty subscription list', async () => {
      // Mock empty subscription list
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.findByUserId.mockResolvedValue([]);

      const result = await getUserSubscriptions(userId);

      expect(result).toEqual([]);
      expect(logInfo).toHaveBeenCalledWith(`Retrieved 0 subscriptions for user: ${userId}`);
    });

    it('should handle database errors during retrieval', async () => {
      // Mock database error
      const SubscriptionModel = require('../../src/db/models/subscription.model');
      SubscriptionModel.findByUserId.mockRejectedValue(new Error('Database error'));

      await expect(getUserSubscriptions(userId))
        .rejects
        .toThrow('Failed to retrieve user subscriptions');

      expect(logError).toHaveBeenCalled();
    });
  });
});