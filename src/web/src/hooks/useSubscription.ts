/**
 * Estate Kit - Custom Subscription Hook
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements a custom hook to streamline subscription-related operations such as 
 *   fetching and updating subscription data.
 * 
 * Human Tasks:
 * 1. Verify error handling aligns with UI error display requirements
 * 2. Test subscription status update workflows in staging environment
 * 3. Validate subscription data persistence across page reloads
 */

// react version ^18.2.0
import { useState, useEffect } from 'react';
// react-redux version ^8.1.2
import { useDispatch, useSelector } from 'react-redux';

import { SubscriptionTypes } from '../types/subscription.types';
import { 
  fetchSubscription, 
  updateSubscription,
  selectSubscriptions,
  selectSubscriptionLoading,
  selectSubscriptionError
} from '../redux/slices/subscriptionSlice';
import { validateSubscription } from '../utils/validation.util';
import { API_BASE_URL } from '../config/api.config';

/**
 * Custom React hook for managing subscription-related operations.
 * Provides a unified interface for fetching and updating subscription data.
 * 
 * @returns {Object} Object containing subscription data and management functions
 */
const useSubscription = () => {
  // Initialize Redux dispatch
  const dispatch = useDispatch();

  // Select subscription data from Redux store
  const subscriptions = useSelector(selectSubscriptions);
  const loading = useSelector(selectSubscriptionLoading);
  const error = useSelector(selectSubscriptionError);

  // Local state for tracking operation status
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Fetches subscription details by ID
   * @param subscriptionId - The ID of the subscription to fetch
   */
  const handleFetchSubscription = async (subscriptionId: string) => {
    try {
      setValidationError(null);
      await dispatch(fetchSubscription(subscriptionId) as any);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to fetch subscription');
    }
  };

  /**
   * Updates the status of a subscription
   * @param subscriptionId - The ID of the subscription to update
   * @param newStatus - The new status to set
   */
  const handleUpdateSubscription = async (
    subscriptionId: string,
    newStatus: 'active' | 'inactive' | 'cancelled'
  ) => {
    try {
      setIsValidating(true);
      setValidationError(null);

      // Validate the current subscription data before update
      const currentSubscription = subscriptions.find(
        (sub) => sub.subscriptionId === subscriptionId
      );

      if (currentSubscription && !validateSubscription(currentSubscription)) {
        throw new Error('Invalid subscription data');
      }

      await dispatch(
        updateSubscription({ subscriptionId, newStatus }) as any
      );
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setIsValidating(false);
    }
  };

  // Effect to validate subscriptions when they change
  useEffect(() => {
    const validateSubscriptions = async () => {
      setIsValidating(true);
      try {
        const invalidSubscriptions = subscriptions.filter(
          (subscription) => !validateSubscription(subscription)
        );
        
        if (invalidSubscriptions.length > 0) {
          setValidationError('One or more subscriptions contain invalid data');
        } else {
          setValidationError(null);
        }
      } catch (error) {
        setValidationError('Error validating subscriptions');
      } finally {
        setIsValidating(false);
      }
    };

    if (subscriptions.length > 0) {
      validateSubscriptions();
    }
  }, [subscriptions]);

  return {
    // Data
    subscriptions,
    loading: loading || isValidating,
    error: error || validationError,

    // Actions
    fetchSubscription: handleFetchSubscription,
    updateSubscription: handleUpdateSubscription,
  };
};

export default useSubscription;