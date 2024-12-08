/**
 * Estate Kit - Subscription Page
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides a user interface for managing subscriptions, including viewing details and updating subscription plans.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application by using reusable components.
 * 
 * Human Tasks:
 * 1. Verify subscription plan pricing and features with business team
 * 2. Test subscription update workflows in staging environment
 * 3. Validate accessibility of subscription components with screen readers
 * 4. Ensure proper error handling for subscription API responses
 */

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Internal imports
import { SubscriptionTypes } from '../../types/subscription.types';
import { fetchSubscriptionDetails, updateSubscriptionStatus } from '../../services/subscription.service';
import SubscriptionPlan from '../../components/subscription/SubscriptionPlan/SubscriptionPlan';
import SubscriptionCard from '../../components/subscription/SubscriptionCard/SubscriptionCard';
import useSubscription from '../../hooks/useSubscription';
import { fetchSubscription, updateSubscription } from '../../redux/slices/subscriptionSlice';

// Import theme for consistent styling
import { theme } from '../../config/theme.config';

/**
 * SubscriptionPage component displays subscription details and allows users to manage their subscriptions.
 * Implements the subscription management requirements from the technical specifications.
 */
const SubscriptionPage: React.FC = () => {
  // Initialize hooks
  const dispatch = useDispatch();
  const { 
    subscriptions, 
    loading, 
    error,
    fetchSubscription: fetchSubscriptionData,
    updateSubscription: updateSubscriptionData
  } = useSubscription();

  // Fetch subscription data on component mount
  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        // Fetch the user's current subscription
        // Note: In a real implementation, you would get the subscriptionId from user context/auth
        await fetchSubscriptionData('current');
      } catch (error) {
        console.error('Failed to load subscription data:', error);
      }
    };

    loadSubscriptionData();
  }, [fetchSubscriptionData]);

  // Callback handlers for subscription actions
  const handleRenewSubscription = useCallback(async () => {
    if (subscriptions[0]?.subscriptionId) {
      try {
        await updateSubscriptionData(subscriptions[0].subscriptionId, 'active');
      } catch (error) {
        console.error('Failed to renew subscription:', error);
      }
    }
  }, [subscriptions, updateSubscriptionData]);

  const handleCancelSubscription = useCallback(async () => {
    if (subscriptions[0]?.subscriptionId) {
      try {
        await updateSubscriptionData(subscriptions[0].subscriptionId, 'cancelled');
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  }, [subscriptions, updateSubscriptionData]);

  const handlePlanSelection = useCallback(async (selectedPlan: SubscriptionTypes) => {
    if (subscriptions[0]?.subscriptionId) {
      try {
        await updateSubscriptionData(subscriptions[0].subscriptionId, 'active');
      } catch (error) {
        console.error('Failed to update subscription plan:', error);
      }
    }
  }, [subscriptions, updateSubscriptionData]);

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        padding: theme.spacing(3),
        textAlign: 'center',
        color: theme.palette.text.secondary 
      }}>
        Loading subscription details...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        padding: theme.spacing(3),
        textAlign: 'center',
        color: theme.palette.error.main 
      }}>
        Error loading subscription details: {error}
      </div>
    );
  }

  return (
    <div style={{
      padding: theme.spacing(3),
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Page Title */}
      <h1 style={{
        fontSize: theme.typography.h4.fontSize,
        fontWeight: theme.typography.fontWeightBold,
        marginBottom: theme.spacing(4),
        color: theme.palette.text.primary
      }}>
        Subscription Management
      </h1>

      {/* Current Subscription Details */}
      {subscriptions[0] && (
        <div style={{ marginBottom: theme.spacing(4) }}>
          <h2 style={{
            fontSize: theme.typography.h5.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            marginBottom: theme.spacing(2),
            color: theme.palette.text.primary
          }}>
            Current Subscription
          </h2>
          <SubscriptionCard
            subscription={subscriptions[0]}
            onRenew={handleRenewSubscription}
            onCancel={handleCancelSubscription}
          />
        </div>
      )}

      {/* Available Subscription Plans */}
      <div>
        <h2 style={{
          fontSize: theme.typography.h5.fontSize,
          fontWeight: theme.typography.fontWeightMedium,
          marginBottom: theme.spacing(2),
          color: theme.palette.text.primary
        }}>
          Available Plans
        </h2>
        <SubscriptionPlan
          plans={subscriptions}
          onSelectPlan={handlePlanSelection}
        />
      </div>
    </div>
  );
};

export default SubscriptionPage;