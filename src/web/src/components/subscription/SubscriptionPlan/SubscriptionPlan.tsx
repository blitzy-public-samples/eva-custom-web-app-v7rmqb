/**
 * Estate Kit - SubscriptionPlan Component
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements the UI for displaying and managing subscription plans.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design using reusable components and theme configuration.
 * 
 * Human Tasks:
 * 1. Verify subscription plan pricing and features with business team
 * 2. Test subscription selection workflow in staging environment
 * 3. Validate accessibility of subscription cards with screen readers
 * 4. Ensure proper error handling for subscription API responses
 */

import React, { useCallback } from 'react';
import { SubscriptionTypes } from '../../../types/subscription.types';
import { fetchSubscriptionDetails } from '../../../services/subscription.service';
import Button from '../../common/Button/Button';
import Card from '../../common/Card/Card';
import { formatSubscriptionStatus } from '../../../utils/format.util';
import { theme } from '../../../config/theme.config';

interface SubscriptionPlanProps {
  /** Array of available subscription plans */
  plans: Array<SubscriptionTypes>;
  /** Callback function triggered when a plan is selected */
  onSelectPlan: (plan: SubscriptionTypes) => void;
}

/**
 * SubscriptionPlan component displays available subscription plans and allows users to select or update their subscription.
 */
const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ plans, onSelectPlan }) => {
  // Memoized plan selection handler
  const handlePlanSelection = useCallback((plan: SubscriptionTypes) => {
    onSelectPlan(plan);
  }, [onSelectPlan]);

  // Render loading state if plans are not available
  if (!plans || plans.length === 0) {
    return (
      <div
        style={{
          padding: theme.spacing(2),
          textAlign: 'center',
          color: theme.palette.text.secondary
        }}
      >
        No subscription plans available
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: theme.spacing(3),
        padding: theme.spacing(2),
      }}
    >
      {plans.map((plan) => (
        <Card
          key={plan.subscriptionId}
          title={plan.plan}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing(2),
            }}
          >
            {/* Plan Status */}
            <div
              dangerouslySetInnerHTML={{
                __html: formatSubscriptionStatus(plan.status)
              }}
              style={{
                marginBottom: theme.spacing(2),
                fontSize: theme.typography.body2.fontSize,
              }}
            />

            {/* Plan Selection Button */}
            <Button
              label={plan.status === 'active' ? 'Current Plan' : 'Select Plan'}
              variant={plan.status === 'active' ? 'secondary' : 'primary'}
              disabled={plan.status === 'active'}
              onClick={() => handlePlanSelection(plan)}
              ariaLabel={`Select ${plan.plan} subscription plan`}
            />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionPlan;