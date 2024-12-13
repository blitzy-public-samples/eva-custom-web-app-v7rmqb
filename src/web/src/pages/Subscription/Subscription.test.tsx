import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { axe, toHaveNoViolations } from 'jest-axe';
import { configureStore } from '@reduxjs/toolkit';
import Subscription from './Subscription';
import { useSubscription } from '../../hooks/useSubscription';
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  BillingCycle 
} from '../../types/subscription.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock useSubscription hook
jest.mock('../../hooks/useSubscription');

// Mock subscription data
const mockSubscriptionData = {
  currentSubscription: {
    id: 'sub_123',
    userId: 'user_123',
    plan: SubscriptionPlan.BASIC,
    status: SubscriptionStatus.ACTIVE,
    startDate: new Date('2024-01-01'),
    endDate: null,
    autoRenew: true,
    shopifySubscriptionId: 'shopify_sub_123',
    shopifyCustomerId: 'shopify_cust_123',
    lastBillingDate: new Date('2024-01-01'),
    nextBillingDate: new Date('2024-02-01')
  },
  availablePlans: [
    {
      id: 'plan_basic',
      name: 'Basic Plan',
      description: 'Essential estate planning tools',
      price: 9.99,
      billingCycle: BillingCycle.MONTHLY,
      features: [
        { id: 'f1', name: 'Digital Vault', description: 'Secure document storage', included: true }
      ],
      shopifyProductId: 'shopify_prod_basic'
    },
    {
      id: 'plan_premium',
      name: 'Premium Plan',
      description: 'Complete estate planning solution',
      price: 19.99,
      billingCycle: BillingCycle.MONTHLY,
      features: [
        { id: 'f2', name: 'Digital Vault Plus', description: 'Enhanced storage', included: true }
      ],
      shopifyProductId: 'shopify_prod_premium'
    }
  ],
  loading: {
    any: false,
    fetch: false,
    update: false,
    cancel: false
  },
  error: {
    global: null,
    fetch: null,
    update: null,
    cancel: null
  },
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn()
};

// Mock Redux store
const createMockStore = () => configureStore({
  reducer: {
    subscription: (state = {}, action) => state
  },
  preloadedState: {
    subscription: mockSubscriptionData
  }
});

// Test setup helper
const renderSubscriptionPage = () => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <Subscription />
    </Provider>
  );
};

describe('Subscription Page', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock useSubscription implementation
    (useSubscription as jest.Mock).mockReturnValue(mockSubscriptionData);
  });

  describe('Rendering', () => {
    it('should render subscription page with current subscription', async () => {
      renderSubscriptionPage();

      // Verify page title
      expect(screen.getByRole('heading', { name: /subscription management/i }))
        .toBeInTheDocument();

      // Verify current subscription details
      expect(screen.getByText(/basic plan/i)).toBeInTheDocument();
      expect(screen.getByText(/9\.99/)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('should render available plans section', () => {
      renderSubscriptionPage();

      // Verify plans section
      expect(screen.getByRole('heading', { name: /available plans/i }))
        .toBeInTheDocument();

      // Verify plan cards
      mockSubscriptionData.availablePlans.forEach(plan => {
        expect(screen.getByText(plan.name)).toBeInTheDocument();
        expect(screen.getByText(plan.description)).toBeInTheDocument();
      });
    });

    it('should render loading states correctly', () => {
      (useSubscription as jest.Mock).mockReturnValue({
        ...mockSubscriptionData,
        loading: { any: true }
      });

      renderSubscriptionPage();

      // Verify loading indicators
      expect(screen.getByRole('status', { name: /loading/i }))
        .toBeInTheDocument();
    });

    it('should render error states correctly', () => {
      const errorMessage = 'Failed to load subscription';
      (useSubscription as jest.Mock).mockReturnValue({
        ...mockSubscriptionData,
        error: { global: errorMessage }
      });

      renderSubscriptionPage();

      // Verify error alert
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  describe('Interactions', () => {
    it('should handle plan selection', async () => {
      const user = userEvent.setup();
      renderSubscriptionPage();

      // Find and click premium plan button
      const selectPlanButton = screen.getByRole('button', { 
        name: /select premium plan/i 
      });
      await user.click(selectPlanButton);

      // Verify confirmation dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/confirm subscription change/i)).toBeInTheDocument();

      // Confirm plan change
      const confirmButton = screen.getByRole('button', { name: /confirm change/i });
      await user.click(confirmButton);

      // Verify update subscription was called
      expect(mockSubscriptionData.updateSubscription).toHaveBeenCalledWith({
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: BillingCycle.MONTHLY,
        autoRenew: true,
        status: SubscriptionStatus.ACTIVE
      });
    });

    it('should handle subscription cancellation', async () => {
      const user = userEvent.setup();
      renderSubscriptionPage();

      // Find and click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel plan/i });
      await user.click(cancelButton);

      // Verify cancellation was called
      expect(mockSubscriptionData.cancelSubscription)
        .toHaveBeenCalledWith(mockSubscriptionData.currentSubscription.id);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderSubscriptionPage();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      renderSubscriptionPage();

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /select basic plan/i }))
        .toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /select premium plan/i }))
        .toHaveFocus();
    });

    it('should announce status changes to screen readers', async () => {
      renderSubscriptionPage();

      // Verify ARIA live regions
      expect(screen.getByRole('status', { name: /subscription status/i }))
        .toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when plan update fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to update subscription';
      
      (useSubscription as jest.Mock).mockReturnValue({
        ...mockSubscriptionData,
        error: { update: errorMessage }
      });

      renderSubscriptionPage();

      // Attempt to update plan
      const selectPlanButton = screen.getByRole('button', { 
        name: /select premium plan/i 
      });
      await user.click(selectPlanButton);

      // Verify error message
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });

    it('should handle network errors gracefully', async () => {
      (useSubscription as jest.Mock).mockReturnValue({
        ...mockSubscriptionData,
        error: { global: 'Network error' }
      });

      renderSubscriptionPage();

      // Verify error handling UI
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
    });
  });
});