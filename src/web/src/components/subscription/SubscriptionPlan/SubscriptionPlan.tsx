import React, { useCallback, memo } from 'react';
import { 
  Typography, 
  Button, 
  List, 
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import Card from '../../common/Card/Card';
import type { ISubscriptionPlanDetails } from '../../../types/subscription.types';

/**
 * Props interface for SubscriptionPlan component with enhanced accessibility
 */
export interface SubscriptionPlanProps {
  plan: ISubscriptionPlanDetails;
  isCurrentPlan: boolean;
  onSelect: (planId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * SubscriptionPlan component displays plan details with enhanced accessibility
 * and senior-friendly features.
 * 
 * @version 1.0.0
 */
export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = memo(({
  plan,
  isCurrentPlan,
  onSelect,
  isLoading,
  error
}) => {
  const theme = useTheme();
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);

  /**
   * Handles plan selection with confirmation dialog
   */
  const handlePlanSelect = useCallback(async () => {
    if (isCurrentPlan || isLoading) return;
    setConfirmDialogOpen(true);
  }, [isCurrentPlan, isLoading]);

  /**
   * Handles confirmation dialog actions
   */
  const handleConfirm = useCallback(async () => {
    try {
      await onSelect(plan.id);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  }, [plan.id, onSelect]);

  /**
   * Renders plan features with enhanced visibility
   */
  const Features = memo(() => (
    <List 
      aria-label={`${plan.name} features`}
      sx={{ 
        mt: 2,
        '& .MuiListItem-root': {
          padding: theme.spacing(1, 0),
          alignItems: 'flex-start'
        }
      }}
    >
      {plan.features.map((feature) => (
        <ListItem
          key={feature.id}
          sx={{ gap: 2 }}
          role="listitem"
          aria-label={feature.description}
        >
          <CheckIcon
            sx={{
              color: theme.palette.secondary.main,
              fontSize: '1.5rem',
              marginTop: '2px'
            }}
            aria-hidden="true"
          />
          <Typography
            variant="body1"
            color="text.primary"
            sx={{ 
              fontSize: '1.1rem',
              lineHeight: 1.5
            }}
          >
            {feature.description}
          </Typography>
        </ListItem>
      ))}
    </List>
  ));

  return (
    <>
      <Card
        title={plan.name}
        subtitle={plan.description}
        elevation={1}
        aria-label={`${plan.name} subscription plan`}
        testId={`subscription-plan-${plan.id}`}
      >
        <Typography
          variant="h4"
          component="p"
          sx={{
            fontSize: '2rem',
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 2,
            display: 'flex',
            alignItems: 'baseline',
            gap: 1
          }}
        >
          ${plan.price}
          <Typography
            component="span"
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: '1.1rem' }}
          >
            /month
          </Typography>
        </Typography>

        <Features />

        <Button
          variant={isCurrentPlan ? "outlined" : "contained"}
          color={isCurrentPlan ? "secondary" : "primary"}
          fullWidth
          size="large"
          onClick={handlePlanSelect}
          disabled={isLoading || isCurrentPlan}
          sx={{
            mt: 3,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 600
          }}
          aria-label={isCurrentPlan ? 
            "Your current plan" : 
            `Select ${plan.name} plan`}
        >
          {isCurrentPlan ? "Current Plan" : "Select Plan"}
        </Button>

        {error && (
          <Typography
            color="error"
            sx={{ mt: 2, fontSize: '1rem' }}
            role="alert"
          >
            {error.message}
          </Typography>
        )}
      </Card>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="confirm-subscription-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          id="confirm-subscription-title"
          sx={{ fontSize: '1.5rem' }}
        >
          Confirm Subscription Change
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', mt: 1 }}>
            Are you sure you want to switch to the {plan.name} plan? 
            Your subscription will be updated immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
            size="large"
            sx={{ fontSize: '1.1rem' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ fontSize: '1.1rem' }}
          >
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

SubscriptionPlan.displayName = 'SubscriptionPlan';

export default SubscriptionPlan;