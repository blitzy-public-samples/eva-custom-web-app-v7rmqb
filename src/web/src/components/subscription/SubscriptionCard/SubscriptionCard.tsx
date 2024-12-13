import React from 'react';
import { Typography, Button, Stack } from '@mui/material';
import { format } from 'date-fns';
import Card, { CardProps } from '../../common/Card/Card';
import { ISubscription, SubscriptionStatus } from '../../../types/subscription.types';

/**
 * Props interface for SubscriptionCard component
 */
export interface SubscriptionCardProps {
  /** Current subscription data */
  subscription: ISubscription;
  /** Subscription plan details */
  planDetails: {
    name: string;
    price: number;
    description: string;
  };
  /** Optional callback for manage subscription action */
  onManage?: () => void;
  /** Optional callback for cancel subscription action */
  onCancel?: () => void;
  /** Optional CSS class name */
  className?: string;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
}

/**
 * Formats price with Canadian dollar symbol and proper localization
 * @param price - Numeric price value
 * @param locale - Optional locale string, defaults to 'en-CA'
 */
const formatPrice = (price: number, locale: string = 'en-CA'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * Returns WCAG compliant color for subscription status
 * @param status - Current subscription status
 */
const getStatusColor = (status: SubscriptionStatus): string => {
  const colors = {
    [SubscriptionStatus.ACTIVE]: '#2F855A', // Green 700 - WCAG AAA compliant
    [SubscriptionStatus.CANCELLED]: '#C53030', // Red 700 - WCAG AAA compliant
    [SubscriptionStatus.EXPIRED]: '#C53030', // Red 700 - WCAG AAA compliant
    [SubscriptionStatus.PENDING]: '#2A4365', // Blue 800 - WCAG AAA compliant
  };
  return colors[status] || colors[SubscriptionStatus.PENDING];
};

/**
 * Senior-friendly subscription card component with enhanced accessibility
 * Displays subscription details and management options in a clear, readable format
 */
export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  planDetails,
  onManage,
  onCancel,
  className,
  isLoading = false,
  error = null,
}) => {
  // Prepare action buttons if callbacks are provided
  const actions = React.useMemo(() => {
    const buttons = [];
    
    if (onManage) {
      buttons.push(
        <Button
          key="manage"
          variant="contained"
          onClick={onManage}
          disabled={isLoading}
          aria-label="Manage subscription"
          sx={{ minWidth: '120px' }}
        >
          Manage Plan
        </Button>
      );
    }

    if (onCancel && subscription.status === SubscriptionStatus.ACTIVE) {
      buttons.push(
        <Button
          key="cancel"
          variant="outlined"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cancel subscription"
          sx={{ minWidth: '120px', ml: 2 }}
          color="error"
        >
          Cancel Plan
        </Button>
      );
    }

    return buttons;
  }, [onManage, onCancel, subscription.status, isLoading]);

  return (
    <Card
      title="Your Subscription"
      className={className}
      elevation={2}
      actions={actions}
      testId="subscription-card"
      aria-label="Subscription information"
      aria-busy={isLoading}
      aria-live="polite"
    >
      <Stack spacing={3}>
        {error && (
          <Typography
            color="error"
            role="alert"
            sx={{ mb: 2, fontSize: '1.1rem' }}
          >
            {error.message}
          </Typography>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h6"
            component="p"
            sx={{ fontSize: '1.3rem', fontWeight: 600 }}
          >
            {planDetails.name}
          </Typography>
          <Typography
            variant="h6"
            component="p"
            sx={{ fontSize: '1.3rem', fontWeight: 600 }}
          >
            {formatPrice(planDetails.price)}
          </Typography>
        </Stack>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}
        >
          {planDetails.description}
        </Typography>

        <Stack spacing={2}>
          <Typography
            component="div"
            role="status"
            sx={{
              fontSize: '1.1rem',
              color: getStatusColor(subscription.status),
              fontWeight: 500,
            }}
          >
            Status: {subscription.status}
          </Typography>

          <Typography
            component="div"
            sx={{ fontSize: '1.1rem' }}
          >
            Start Date: {format(new Date(subscription.startDate), 'MMMM d, yyyy')}
          </Typography>

          {subscription.nextBillingDate && (
            <Typography
              component="div"
              sx={{ fontSize: '1.1rem' }}
            >
              Next Billing: {format(new Date(subscription.nextBillingDate), 'MMMM d, yyyy')}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

export default SubscriptionCard;