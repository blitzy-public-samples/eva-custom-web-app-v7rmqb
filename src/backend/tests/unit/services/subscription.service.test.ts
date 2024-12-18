/**
 * @fileoverview Comprehensive unit tests for SubscriptionService
 * Validates subscription management, Shopify integration, security, and error handling
 * @version 1.0.0
 */

import { describe, beforeEach, test, expect, jest } from '@jest/globals'; // ^29.0.0
import { Repository } from 'typeorm';
import { createMockRepository } from '@golevelup/ts-jest'; // ^1.0.0
import crypto from 'crypto';

// Internal imports
import { SubscriptionService } from '../../../src/services/subscription.service';
import { ShopifyIntegration } from '../../../src/integrations/shopify.integration';
import { 
  mockSubscription, 
  mockSubscriptionCreateDTO, 
  mockSubscriptionScenarios 
} from '../../mocks/subscription.mock';
import { AuditEventType, AuditSeverity } from '../../../src/types/audit.types';
import { SubscriptionStatus } from '../../../src/types/subscription.types';

// Mock implementations
jest.mock('../../../src/integrations/shopify.integration');
jest.mock('winston');

describe('SubscriptionService', () => {
  // Service instance and dependencies
  let subscriptionService: SubscriptionService;
  let mockRepository: jest.Mocked<Repository<any>>;
  let mockShopifyIntegration: jest.Mocked<ShopifyIntegration>;
  let mockLogger: jest.Mocked<any>;
  let mockQueryRunner: jest.Mocked<any>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockRepository = createMockRepository() as jest.Mocked<Repository<any>>;
    mockShopifyIntegration = {
      createOrder: jest.fn(),
      handleWebhook: jest.fn(),
      verifyWebhookSignature: jest.fn()
    } as any;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    // Mock query runner for transactions
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn()
      }
    };

    mockRepository.manager = {
      connection: {
        createQueryRunner: () => mockQueryRunner
      }
    } as any;

    // Initialize service
    subscriptionService = new SubscriptionService(
      mockRepository,
      mockShopifyIntegration,
      mockLogger
    );
  });

  describe('createSubscription', () => {
    test('should create subscription with proper security validation', async () => {
      // Setup
      const shopifyOrder = { id: 'mock-order-id' };
      mockShopifyIntegration.createOrder.mockResolvedValue(shopifyOrder);
      mockQueryRunner.manager.save.mockResolvedValue(mockSubscription);

      // Execute
      const result = await subscriptionService.createSubscription(mockSubscriptionCreateDTO);

      // Verify
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockShopifyIntegration.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        customer: {
          email: mockSubscriptionCreateDTO.userId,
          firstName: '',
          lastName: ''
        },
        lineItems: expect.any(Array)
      }));
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockSubscriptionCreateDTO.userId,
        plan: mockSubscriptionCreateDTO.plan,
        status: SubscriptionStatus.PENDING
      }));
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });

    test('should handle transaction rollback on error', async () => {
      // Setup
      const error = new Error('Shopify integration error');
      mockShopifyIntegration.createOrder.mockRejectedValue(error);

      // Execute and verify
      await expect(subscriptionService.createSubscription(mockSubscriptionCreateDTO))
        .rejects.toThrow('Shopify integration error');
      
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create subscription',
        expect.objectContaining({
          error: error.message,
          userId: mockSubscriptionCreateDTO.userId
        })
      );
    });

    test('should enforce rate limiting', async () => {
      // Setup multiple rapid requests
      const requests = Array(5).fill(mockSubscriptionCreateDTO);
      
      // Execute and verify rate limit
      const results = await Promise.allSettled(
        requests.map(dto => subscriptionService.createSubscription(dto))
      );

      const rejected = results.filter(r => r.status === 'rejected');
      expect(rejected.length).toBeGreaterThan(0);
    });
  });

  describe('handleShopifyWebhook', () => {
    const mockWebhookEvent = {
      topic: 'orders/paid',
      payload: { id: mockSubscription.shopifySubscriptionId },
      signature: 'mock-signature',
      timestamp: new Date().toISOString()
    };

    test('should process valid webhook with signature verification', async () => {
      // Setup
      mockShopifyIntegration.verifyWebhookSignature.mockReturnValue(true);
      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE
      });

      // Execute
      await subscriptionService.handleShopifyWebhook(mockWebhookEvent);

      // Verify
      expect(mockShopifyIntegration.verifyWebhookSignature).toHaveBeenCalledWith(
        mockWebhookEvent.signature,
        JSON.stringify(mockWebhookEvent.payload),
        mockWebhookEvent.timestamp
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.ACTIVE
        })
      );
    });

    test('should reject invalid webhook signatures', async () => {
      // Setup
      mockShopifyIntegration.verifyWebhookSignature.mockReturnValue(false);

      // Execute and verify
      await expect(subscriptionService.handleShopifyWebhook(mockWebhookEvent))
        .rejects.toThrow('Invalid webhook signature');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process subscription webhook',
        expect.any(Object)
      );
    });

    test('should handle subscription cancellation webhook', async () => {
      // Setup
      const cancelWebhook = {
        ...mockWebhookEvent,
        topic: 'orders/cancelled'
      };
      mockShopifyIntegration.verifyWebhookSignature.mockReturnValue(true);
      mockRepository.findOne.mockResolvedValue(mockSubscription);

      // Execute
      await subscriptionService.handleShopifyWebhook(cancelWebhook);

      // Verify
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.CANCELLED,
          endDate: expect.any(Date)
        })
      );
    });
  });

  describe('Security and Compliance', () => {
    test('should log audit events for subscription changes', async () => {
      // Setup
      mockShopifyIntegration.createOrder.mockResolvedValue({ id: 'mock-order-id' });
      mockQueryRunner.manager.save.mockImplementation(subscription => subscription);

      // Execute
      await subscriptionService.createSubscription(mockSubscriptionCreateDTO);

      // Verify audit logging
      const savedSubscription = mockQueryRunner.manager.save.mock.calls[0][0];
      expect(savedSubscription.auditLogs).toContainEqual(
        expect.objectContaining({
          eventType: AuditEventType.SUBSCRIPTION_CHANGE,
          severity: AuditSeverity.INFO,
          resourceType: 'subscription'
        })
      );
    });

    test('should validate subscription data integrity', async () => {
      // Setup invalid subscription data
      const invalidDTO = {
        ...mockSubscriptionCreateDTO,
        userId: ''  // Invalid empty user ID
      };

      // Execute and verify
      await expect(subscriptionService.createSubscription(invalidDTO))
        .rejects.toThrow('Invalid subscription data');
    });
  });
});