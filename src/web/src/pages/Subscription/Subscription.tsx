import React, { useCallback, useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert,
  Skeleton
} from '@mui/material';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionPlan } from '../../components/subscription/SubscriptionPlan/SubscriptionPlan';
import { SubscriptionCard } from '../../components/subscription/SubscriptionCard/SubscriptionCard';
import type { ISubscriptionPlanDetails } from '../../types/subscription.types';
import { SubscriptionStatus } from '../../types/subscription.types';

/**
 * Subscription Management Page Component
 * 
 * Provides a senior-friendly interface for managing Estate Kit subscriptions
 * with enhanced accessibility features and comprehensive error handling.
 * 
 * @version 1.0.0
 */
export const Subscription: React.FC = () => {
  // Local state for operation-specific loading
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Get subscription data and operations from hook
  const {
    currentSubscription,
    availablePlans,
    loading,
    error,
    updateSubscription,
    cancelSubscription
  } = useSubscription();

  /**
   * Handles subscription plan selection with confirmation
   */
  const handlePlanSelect = useCallback(async (planId: string) => {
    try {
      setSelectedPlanId(planId);
      
      const selectedPlan = availablePlans.find(plan => plan.planId === planId);
      if (!selectedPlan) {
        throw new Error('Selected plan not found');
      }

      await updateSubscription({
        plan: selectedPlan,
        billingCycle: selectedPlan.billingCycle,
        autoRenew: true,
        status: SubscriptionStatus.ACTIVE
      });

      // Announce success to screen readers
      const announcement = `Successfully updated to ${selectedPlan.name} plan`;
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('aria-live', 'polite');
      ariaLive.textContent = announcement;
      document.body.appendChild(ariaLive);
      setTimeout(() => document.body.removeChild(ariaLive), 1000);

    } catch (err: any) {
      console.error('Failed to update subscription:', err);
    } finally {
      setSelectedPlanId(null);
    }
  }, [availablePlans, updateSubscription]);

  /**
   * Handles subscription cancellation with confirmation
   */
  const handleCancelSubscription = useCallback(async () => {
    if (!currentSubscription?.subscriptionId) return;

    try {
      await cancelSubscription(currentSubscription.subscriptionId);

      // Announce cancellation to screen readers
      const announcement = 'Subscription successfully cancelled';
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('aria-live', 'polite');
      ariaLive.textContent = announcement;
      document.body.appendChild(ariaLive);
      setTimeout(() => document.body.removeChild(ariaLive), 1000);

    } catch (err: any) {
      console.error('Failed to cancel subscription:', err);
    }
  }, [currentSubscription, cancelSubscription]);

  /**
   * Renders loading skeleton for subscription card
   */
  const renderSubscriptionSkeleton = () => (
    <Skeleton
      variant="rectangular"
      height={300}
      sx={{ borderRadius: 2, mb: 4 }}
      aria-label="Loading subscription details"
    />
  );

  /**
   * Renders loading skeleton for plan cards
   */
  const renderPlansSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3].map((index) => (
        <Grid item xs={12} md={4} key={index}>
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 2 }}
            aria-label="Loading plan details"
          />
        </Grid>
      ))}
    </Grid>
  );

  // Create a complete subscription object with all required properties
  const completeSubscription = currentSubscription ? {
    ...currentSubscription,
    shopifySubscriptionId: currentSubscription.shopifySubscriptionId || '',
    shopifyCustomerId: currentSubscription.shopifyCustomerId || '',
    lastBillingDate: new Date(currentSubscription.lastBillingDate || new Date()),
    nextBillingDate: new Date(currentSubscription.nextBillingDate || new Date())
  } : null;

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 4 }}
      component="main"
      role="main"
      aria-label="Subscription Management"
    >
      <Typography
        variant="h1"
        component="h1"
        gutterBottom
        sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          mb: 4,
          color: 'text.primary'
        }}
      >
        Subscription Management
      </Typography>

      {/* Error Alert */}
      {error?.global && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          role="alert"
        >
          {error.global}
        </Alert>
      )}

      {/* Current Subscription Section */}
      <section
        aria-label="Current Subscription"
        role="region"
      >
        {loading.any ? (
          renderSubscriptionSkeleton()
        ) : completeSubscription && (
          <SubscriptionCard
            subscription={completeSubscription}
            planDetails={availablePlans.find(
              plan => plan.planId === completeSubscription.plan.planId
            ) || {
              name: 'Loading...',
              price: 0,
              description: ''
            }}
            onCancel={handleCancelSubscription}
            isLoading={loading.cancel}
            error={error.cancel ? new Error(error.cancel) : null}
            className="subscription-card"
          />
        )}
      </section>

      {/* Available Plans Section */}
      <section
        aria-label="Available Plans"
        role="region"
      >
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: '2rem',
            fontWeight: 600,
            mt: 6,
            mb: 4,
            color: 'text.primary'
          }}
        >
          Available Plans
        </Typography>

        {loading.any ? (
          renderPlansSkeleton()
        ) : (
          <Grid container spacing={3}>
            {availablePlans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.planId}>
                <SubscriptionPlan
                  plan={plan}
                  isCurrentPlan={currentSubscription?.plan.planId === plan.planId}
                  onSelect={handlePlanSelect}
                  isLoading={selectedPlanId === plan.planId}
                  error={error.update ? new Error(error.update) : null}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </section>

      {/* Loading Overlay */}
      {loading.any && (
        <div
          role="status"
          aria-label="Loading"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}
        >
          <CircularProgress size={60} />
        </div>
      )}
    </Container>
  );
};

export default Subscription;