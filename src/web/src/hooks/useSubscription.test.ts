/**
 * Unit tests for useSubscription custom hook
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Validates the functionality of the useSubscription hook, including fetching and updating subscription data.
 */

// @testing-library/react-hooks version ^7.0.2
import { renderHook, act } from '@testing-library/react-hooks';
// jest version ^29.0.0
import { jest } from '@jest/globals';
// react-redux version ^8.1.2
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import useSubscription from './useSubscription';
import { subscriptionReducer } from '../redux/slices/subscriptionSlice';
import { 
  fetchSubscriptionDetails, 
  updateSubscriptionStatus 
} from '../services/subscription.service';
import { API_BASE_URL } from '../config/api.config';

// Mock the subscription service functions
jest.mock('../services/subscription.service', () => ({
  fetchSubscriptionDetails: jest.fn(),
  updateSubscriptionStatus: jest.fn()
}));

// Mock subscription data
const mockSubscription = {
  subscriptionId: '123',
  userId: 'user123',
  plan: 'premium',
  status: 'active' as const,
  startDate: new Date(),
  endDate: new Date()
};

// Setup test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      subscription: subscriptionReducer
    },
    preloadedState: {
      subscription: {
        subscriptions: [],
        loading: false,
        error: null
      }
    }
  });
};

// Wrapper component for providing store context
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore();
  return <Provider store={store}>{children}</Provider>;
};

describe('useSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch subscription details successfully', async () => {
    // Mock successful API response
    (fetchSubscriptionDetails as jest.Mock).mockResolvedValueOnce(mockSubscription);

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });

    // Initial state check
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.subscriptions).toEqual([]);

    // Trigger subscription fetch
    act(() => {
      result.current.fetchSubscription('123');
    });

    // Verify loading state
    expect(result.current.loading).toBe(true);

    // Wait for update to complete
    await waitForNextUpdate();

    // Verify final state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.subscriptions).toContainEqual(mockSubscription);
    expect(fetchSubscriptionDetails).toHaveBeenCalledWith('123');
  });

  it('should handle errors during subscription fetch', async () => {
    // Mock API error
    const errorMessage = 'Failed to fetch subscription';
    (fetchSubscriptionDetails as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });

    // Trigger subscription fetch
    act(() => {
      result.current.fetchSubscription('123');
    });

    // Wait for update to complete
    await waitForNextUpdate();

    // Verify error state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(fetchSubscriptionDetails).toHaveBeenCalledWith('123');
  });

  it('should update subscription status successfully', async () => {
    // Mock successful API response
    const updatedSubscription = { ...mockSubscription, status: 'inactive' as const };
    (updateSubscriptionStatus as jest.Mock).mockResolvedValueOnce(updatedSubscription);

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });

    // Trigger subscription update
    act(() => {
      result.current.updateSubscription('123', 'inactive');
    });

    // Verify loading state
    expect(result.current.loading).toBe(true);

    // Wait for update to complete
    await waitForNextUpdate();

    // Verify final state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(updateSubscriptionStatus).toHaveBeenCalledWith('123', 'inactive');
  });

  it('should handle errors during subscription update', async () => {
    // Mock API error
    const errorMessage = 'Failed to update subscription';
    (updateSubscriptionStatus as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useSubscription(), { wrapper });

    // Trigger subscription update
    act(() => {
      result.current.updateSubscription('123', 'inactive');
    });

    // Wait for update to complete
    await waitForNextUpdate();

    // Verify error state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(updateSubscriptionStatus).toHaveBeenCalledWith('123', 'inactive');
  });

  it('should validate subscription data before update', async () => {
    // Setup initial state with invalid subscription
    const invalidSubscription = { ...mockSubscription, status: 'invalid' as any };
    const store = createTestStore();
    store.dispatch({ 
      type: 'subscription/fetchSubscription/fulfilled', 
      payload: invalidSubscription 
    });

    // Render the hook with store containing invalid data
    const { result, waitForNextUpdate } = renderHook(() => useSubscription(), {
      wrapper: ({ children }) => (
        <Provider store={store}>{children}</Provider>
      )
    });

    // Trigger subscription update
    act(() => {
      result.current.updateSubscription('123', 'inactive');
    });

    // Wait for validation to complete
    await waitForNextUpdate();

    // Verify error state due to invalid data
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Invalid subscription data');
    expect(updateSubscriptionStatus).not.toHaveBeenCalled();
  });
});