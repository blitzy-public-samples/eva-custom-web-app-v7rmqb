/**
 * Test Suite for useSubscription Custom Hook
 * Version: 1.0.0
 * 
 * Comprehensive test suite for subscription management functionality
 * including performance benchmarks, error handling, and state validation.
 * 
 * @package @testing-library/react-hooks ^8.0.1
 * @package @testing-library/react ^13.4.0
 * @package jest-fetch-mock ^3.0.3
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import useSubscription from './useSubscription';
import { subscriptionThunks } from '../redux/slices/subscriptionSlice';
import { 
  ISubscription, 
  SubscriptionPlan, 
  SubscriptionStatus,
  BillingCycle 
} from '../types/subscription.types';

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    subscription: (state = {
      currentSubscription: null,
      availablePlans: [],
      loading: {},
      error: null,
      cache: { plans: {}, expiresAt: null }
    }, action) => state
  }
});

// Mock subscription data
const mockSubscription: ISubscription = {
  id: '123',
  userId: 'user123',
  plan: SubscriptionPlan.PREMIUM,
  status: SubscriptionStatus.ACTIVE,
  startDate: new Date(),
  endDate: null,
  autoRenew: true,
  shopifySubscriptionId: 'shop123',
  shopifyCustomerId: 'cust123',
  lastBillingDate: new Date(),
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
};

// Test wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>{children}</Provider>
);

describe('useSubscription Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Performance Tests', () => {
    it('should fetch subscription within 500ms', async () => {
      const startTime = performance.now();
      
      jest.spyOn(subscriptionThunks, 'fetchCurrentSubscription')
        .mockResolvedValue(mockSubscription);

      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      await act(async () => {
        await waitForNextUpdate();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
      expect(result.current.currentSubscription).toEqual(mockSubscription);
    });

    it('should update subscription within 500ms', async () => {
      const startTime = performance.now();
      
      jest.spyOn(subscriptionThunks, 'updateSubscription')
        .mockResolvedValue({ ...mockSubscription, plan: SubscriptionPlan.BASIC });

      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      await act(async () => {
        await result.current.updateSubscription({
          plan: SubscriptionPlan.BASIC,
          billingCycle: BillingCycle.MONTHLY,
          autoRenew: true,
          status: SubscriptionStatus.ACTIVE
        });
        await waitForNextUpdate();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should utilize cache for repeated plan fetches', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      // First fetch
      const startTime1 = performance.now();
      await act(async () => {
        await result.current.fetchSubscriptionPlans();
        await waitForNextUpdate();
      });
      const duration1 = performance.now() - startTime1;

      // Second fetch (should use cache)
      const startTime2 = performance.now();
      await act(async () => {
        await result.current.fetchSubscriptionPlans();
        await waitForNextUpdate();
      });
      const duration2 = performance.now() - startTime2;

      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      jest.spyOn(subscriptionThunks, 'fetchCurrentSubscription')
        .mockRejectedValue(new Error('Network Error'));

      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.error.fetch).toBe('Network Error');
      expect(result.current.currentSubscription).toBeNull();
    });

    it('should implement retry mechanism for failed requests', async () => {
      const fetchMock = jest.spyOn(subscriptionThunks, 'fetchCurrentSubscription');
      fetchMock
        .mockRejectedValueOnce(new Error('Temporary Error'))
        .mockRejectedValueOnce(new Error('Temporary Error'))
        .mockResolvedValueOnce(mockSubscription);

      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.current.currentSubscription).toEqual(mockSubscription);
    });

    it('should handle validation errors during subscription updates', async () => {
      const errorMessage = 'Invalid subscription plan';
      jest.spyOn(subscriptionThunks, 'updateSubscription')
        .mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSubscription(), { wrapper });
      
      await act(async () => {
        try {
          await result.current.updateSubscription({
            plan: SubscriptionPlan.BASIC,
            billingCycle: BillingCycle.MONTHLY,
            autoRenew: true,
            status: SubscriptionStatus.ACTIVE
          });
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error.update).toBe(errorMessage);
    });
  });

  describe('State Management', () => {
    it('should manage loading states correctly', async () => {
      jest.spyOn(subscriptionThunks, 'fetchCurrentSubscription')
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockSubscription), 100)));

      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      expect(result.current.loading.fetch).toBe(true);
      
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.loading.fetch).toBe(false);
    });

    it('should update subscription state after successful operations', async () => {
      const updatedSubscription = {
        ...mockSubscription,
        plan: SubscriptionPlan.BASIC
      };

      jest.spyOn(subscriptionThunks, 'updateSubscription')
        .mockResolvedValue(updatedSubscription);

      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      await act(async () => {
        await result.current.updateSubscription({
          plan: SubscriptionPlan.BASIC,
          billingCycle: BillingCycle.MONTHLY,
          autoRenew: true,
          status: SubscriptionStatus.ACTIVE
        });
        await waitForNextUpdate();
      });

      expect(result.current.currentSubscription).toEqual(updatedSubscription);
    });

    it('should handle concurrent operations correctly', async () => {
      const fetchMock = jest.spyOn(subscriptionThunks, 'fetchCurrentSubscription')
        .mockResolvedValue(mockSubscription);
      const updateMock = jest.spyOn(subscriptionThunks, 'updateSubscription')
        .mockResolvedValue({ ...mockSubscription, plan: SubscriptionPlan.BASIC });

      const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });
      
      await act(async () => {
        const fetchPromise = result.current.fetchCurrentSubscription();
        const updatePromise = result.current.updateSubscription({
          plan: SubscriptionPlan.BASIC,
          billingCycle: BillingCycle.MONTHLY,
          autoRenew: true,
          status: SubscriptionStatus.ACTIVE
        });
        
        await Promise.all([fetchPromise, updatePromise]);
        await waitForNextUpdate();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(result.current.loading.fetch).toBe(false);
      expect(result.current.loading.update).toBe(false);
    });
  });
});