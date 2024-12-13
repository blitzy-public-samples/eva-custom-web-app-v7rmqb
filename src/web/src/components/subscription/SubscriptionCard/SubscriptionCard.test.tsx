import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../config/theme.config';
import SubscriptionCard, { SubscriptionCardProps } from './SubscriptionCard';
import { ISubscription, SubscriptionPlan, SubscriptionStatus } from '../../../types/subscription.types';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock date-fns to ensure consistent date formatting in tests
vi.mock('date-fns', () => ({
  format: vi.fn().mockImplementation(() => 'January 1, 2024'),
}));

// Default test data
const mockSubscription: ISubscription = {
  id: 'test-sub-123',
  userId: 'test-user-123',
  plan: SubscriptionPlan.PREMIUM,
  status: SubscriptionStatus.ACTIVE,
  startDate: new Date('2024-01-01'),
  endDate: null,
  autoRenew: true,
  shopifySubscriptionId: 'shop-sub-123',
  shopifyCustomerId: 'shop-cust-123',
  lastBillingDate: new Date('2024-01-01'),
  nextBillingDate: new Date('2024-02-01'),
};

const mockPlanDetails = {
  name: 'Premium Plan',
  price: 29.99,
  description: 'Complete estate planning solution with unlimited storage',
};

// Helper function to render component with theme provider
const renderSubscriptionCard = (props: Partial<SubscriptionCardProps> = {}) => {
  const defaultProps: SubscriptionCardProps = {
    subscription: mockSubscription,
    planDetails: mockPlanDetails,
    isLoading: false,
    error: null,
  };

  return render(
    <ThemeProvider theme={theme}>
      <SubscriptionCard {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('SubscriptionCard Component', () => {
  describe('Rendering', () => {
    it('renders subscription details correctly', () => {
      renderSubscriptionCard();

      // Verify plan name and price
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('CA$29.99')).toBeInTheDocument();

      // Verify dates
      expect(screen.getByText(/Start Date:/)).toBeInTheDocument();
      expect(screen.getByText(/Next Billing:/)).toBeInTheDocument();

      // Verify status
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveTextContent('Status: ACTIVE');
      expect(statusElement).toHaveStyle({ color: '#2F855A' }); // Active status color
    });

    it('handles loading state correctly', () => {
      renderSubscriptionCard({ isLoading: true });
      
      const card = screen.getByTestId('subscription-card');
      expect(card).toHaveAttribute('aria-busy', 'true');
      
      // Verify buttons are disabled during loading
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('displays error message when error prop is provided', () => {
      const error = new Error('Subscription update failed');
      renderSubscriptionCard({ error });

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Subscription update failed');
      expect(errorMessage).toHaveStyle({ color: 'error' });
    });
  });

  describe('User Interactions', () => {
    it('calls onManage when manage button is clicked', () => {
      const onManage = vi.fn();
      renderSubscriptionCard({ onManage });

      const manageButton = screen.getByRole('button', { name: /manage subscription/i });
      fireEvent.click(manageButton);

      expect(onManage).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      renderSubscriptionCard({ onCancel });

      const cancelButton = screen.getByRole('button', { name: /cancel subscription/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('hides cancel button when subscription is not active', () => {
      const onCancel = vi.fn();
      const inactiveSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };

      renderSubscriptionCard({
        subscription: inactiveSubscription,
        onCancel,
      });

      expect(screen.queryByRole('button', { name: /cancel subscription/i }))
        .not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderSubscriptionCard();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and roles', () => {
      renderSubscriptionCard();

      // Verify card has proper role and label
      const card = screen.getByTestId('subscription-card');
      expect(card).toHaveAttribute('aria-label', 'Subscription information');
      expect(card).toHaveAttribute('aria-live', 'polite');

      // Verify status updates are announced
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      const onManage = vi.fn();
      const onCancel = vi.fn();
      renderSubscriptionCard({ onManage, onCancel });

      // Verify tab order
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0');
      });

      // Verify keyboard activation
      const manageButton = screen.getByRole('button', { name: /manage subscription/i });
      fireEvent.keyPress(manageButton, { key: 'Enter', code: 'Enter' });
      expect(onManage).toHaveBeenCalled();
    });
  });

  describe('Senior-Friendly Features', () => {
    it('uses appropriate text sizes and contrast', () => {
      renderSubscriptionCard();

      // Verify heading sizes
      const planName = screen.getByText('Premium Plan');
      expect(planName).toHaveStyle({ fontSize: '1.3rem' });

      // Verify body text sizes
      const description = screen.getByText(mockPlanDetails.description);
      expect(description).toHaveStyle({ fontSize: '1.1rem' });
    });

    it('maintains readable text with browser zoom', () => {
      const { container } = renderSubscriptionCard();
      const textElements = container.querySelectorAll('p, div');

      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const fontSize = parseFloat(styles.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(16); // Minimum 16px font size
      });
    });

    it('provides clear visual feedback for interactive elements', () => {
      renderSubscriptionCard({ onManage: vi.fn() });

      const manageButton = screen.getByRole('button', { name: /manage subscription/i });
      expect(manageButton).toHaveStyle({ minWidth: '120px' });
      
      // Verify focus styles
      fireEvent.focus(manageButton);
      expect(manageButton).toHaveStyle({ outline: expect.stringContaining('solid') });
    });
  });
});