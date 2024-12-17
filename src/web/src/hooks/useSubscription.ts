/**
 * useSubscription Custom Hook
 * Version: 1.0.0
 * 
 * Custom React hook for managing subscription state and operations with enhanced
 * error handling, loading states, and automatic data refresh capabilities.
 * 
 * @package react ^18.2.0
 * @package react-redux ^8.0.0
 */

import { useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ISubscriptionUpdateDTO 
} from '../types/subscription.types';
import { 
  subscriptionThunks,
  selectCurrentSubscription,
  selectAvailablePlans,
  selectSubscriptionLoading,
  selectSubscriptionError 
} from '../redux/slices/subscriptionSlice';
import { AppDispatch } from '../redux/store';

// Constants for automatic refresh and retry logic
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Custom hook for managing subscription state and operations
 * Provides comprehensive subscription management with enhanced error handling
 */
export const useSubscription = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Local state for operation-specific loading and error states
  const [loading, setLoading] = useState({
    fetch: false,
    update: false,
    cancel: false
  });

  const [error, setError] = useState({
    fetch: null as string | null,
    update: null as string | null,
    cancel: null as string | null
  });

  // Select subscription state from Redux store
  const currentSubscription = useSelector(selectCurrentSubscription);
  const availablePlans = useSelector(selectAvailablePlans);
  const globalLoading = useSelector(selectSubscriptionLoading);
  const globalError = useSelector(selectSubscriptionError);

  /**
   * Fetches current subscription with retry logic
   */
  const fetchCurrentSubscription = useCallback(async () => {
    let retries = 0;
    setLoading(prev => ({ ...prev, fetch: true }));
    setError(prev => ({ ...prev, fetch: null }));

    const attemptFetch = async (): Promise<void> => {
      try {
        await dispatch(subscriptionThunks.fetchCurrentSubscription({})).unwrap();
      } catch (error: any) {
        if (retries < MAX_RETRIES) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return attemptFetch();
        }
        setError(prev => ({ 
          ...prev, 
          fetch: error.message || 'Failed to fetch subscription' 
        }));
      }
    };

    await attemptFetch();
    setLoading(prev => ({ ...prev, fetch: false }));
  }, [dispatch]);

  /**
   * Fetches available subscription plans with caching
   */
  const fetchSubscriptionPlans = useCallback(async () => {
    setLoading(prev => ({ ...prev, fetch: true }));
    setError(prev => ({ ...prev, fetch: null }));

    try {
      await dispatch(subscriptionThunks.fetchSubscriptionPlans({})).unwrap();
    } catch (error: any) {
      setError(prev => ({ 
        ...prev, 
        fetch: error.message || 'Failed to fetch subscription plans' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  }, [dispatch]);

  /**
   * Updates subscription with enhanced error handling
   */
  const updateSubscription = useCallback(async (updateData: ISubscriptionUpdateDTO) => {
    setLoading(prev => ({ ...prev, update: true }));
    setError(prev => ({ ...prev, update: null }));

    try {
      await dispatch(subscriptionThunks.updateSubscription(updateData)).unwrap();
      // Refresh subscription data after successful update
      await fetchCurrentSubscription();
    } catch (error: any) {
      setError(prev => ({ 
        ...prev, 
        update: error.message || 'Failed to update subscription' 
      }));
      throw error; // Re-throw for component-level handling
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  }, [dispatch, fetchCurrentSubscription]);

  /**
   * Cancels subscription with confirmation and error handling
   */
  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setLoading(prev => ({ ...prev, cancel: true }));
    setError(prev => ({ ...prev, cancel: null }));

    try {
      await dispatch(subscriptionThunks.cancelSubscription(subscriptionId)).unwrap();
      // Refresh subscription data after successful cancellation
      await fetchCurrentSubscription();
    } catch (error: any) {
      setError(prev => ({ 
        ...prev, 
        cancel: error.message || 'Failed to cancel subscription' 
      }));
      throw error; // Re-throw for component-level handling
    } finally {
      setLoading(prev => ({ ...prev, cancel: false }));
    }
  }, [dispatch, fetchCurrentSubscription]);

  // Initialize subscription data on mount
  useEffect(() => {
    fetchCurrentSubscription();
    fetchSubscriptionPlans();

    // Set up automatic refresh interval
    const refreshInterval = setInterval(() => {
      if (!loading.fetch && !loading.update && !loading.cancel) {
        fetchCurrentSubscription();
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [fetchCurrentSubscription, fetchSubscriptionPlans]);

  return {
    // State
    currentSubscription,
    availablePlans,
    loading: {
      ...loading,
      any: Object.values(loading).some(Boolean) || Object.values(globalLoading).some(Boolean)
    },
    error: {
      ...error,
      global: globalError?.message || null
    },

    // Operations
    fetchCurrentSubscription,
    fetchSubscriptionPlans,
    updateSubscription,
    cancelSubscription
  };
};

export default useSubscription;