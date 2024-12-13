import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'axe-core';
import { SubscriptionPlan, SubscriptionPlanProps } from './SubscriptionPlan';
import { renderWithProviders } from '../../../utils/test.util';

// Mock plan data
const mockPlan = {
  id: 'premium',
  name: 'Premium Plan',
  description: 'Complete estate planning solution',
  price: 29.99,
  features: [
    { id: '1', name: 'Digital Vault Storage', included: true },
    { id: '2', name: 'Physical Kit', included: true }
  ],
  isPopular: true,
  isSecure: true,
  maxDelegates: 5,
  storageLimit: '10GB'
};

// Mock handlers
const mockHandlers = {
  onSelect: jest.fn(),
  isLoading: false,
  error: null
};

// Helper function to render component with default props
const renderSubscriptionPlan = (props: Partial<SubscriptionPlanProps> = {}) => {
  const defaultProps: SubscriptionPlanProps = {
    plan: mockPlan,
    isCurrentPlan: false,
    onSelect: mockHandlers.onSelect,
    isLoading: mockHandlers.isLoading,
    error: mockHandlers.error
  };

  return renderWithProviders(
    <SubscriptionPlan {...defaultProps} {...props} />
  );
};

describe('SubscriptionPlan Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render plan details correctly', () => {
      renderSubscriptionPlan();

      // Verify plan name and description
      expect(screen.getByText(mockPlan.name)).toBeInTheDocument();
      expect(screen.getByText(mockPlan.description)).toBeInTheDocument();

      // Verify price formatting
      expect(screen.getByText(`$${mockPlan.price}`)).toBeInTheDocument();
      expect(screen.getByText('/month')).toBeInTheDocument();

      // Verify features
      mockPlan.features.forEach(feature => {
        expect(screen.getByText(feature.name)).toBeInTheDocument();
      });
    });

    it('should apply correct styling for popular plans', () => {
      const { container } = renderSubscriptionPlan();
      expect(container.querySelector('.popular-plan')).toBeInTheDocument();
    });

    it('should render secure badge for secure plans', () => {
      renderSubscriptionPlan();
      const card = screen.getByTestId(`subscription-plan-${mockPlan.id}`);
      expect(card).toHaveAttribute('aria-label', `${mockPlan.name} subscription plan`);
    });
  });

  describe('Interaction Handling', () => {
    it('should handle plan selection click', async () => {
      renderSubscriptionPlan();
      
      const selectButton = screen.getByRole('button', { 
        name: `Select ${mockPlan.name} plan` 
      });
      await userEvent.click(selectButton);

      // Verify confirmation dialog appears
      expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
    });

    it('should handle confirmation dialog actions', async () => {
      renderSubscriptionPlan();
      
      // Open dialog
      const selectButton = screen.getByRole('button', { 
        name: `Select ${mockPlan.name} plan` 
      });
      await userEvent.click(selectButton);

      // Confirm selection
      const confirmButton = screen.getByRole('button', { name: 'Confirm Change' });
      await userEvent.click(confirmButton);

      expect(mockHandlers.onSelect).toHaveBeenCalledWith(mockPlan.id);
    });

    it('should handle cancellation', async () => {
      renderSubscriptionPlan();
      
      // Open dialog
      const selectButton = screen.getByRole('button', { 
        name: `Select ${mockPlan.name} plan` 
      });
      await userEvent.click(selectButton);

      // Cancel selection
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await userEvent.click(cancelButton);

      expect(mockHandlers.onSelect).not.toHaveBeenCalled();
      expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should be accessible', async () => {
      const { container } = renderSubscriptionPlan();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      renderSubscriptionPlan();
      
      // Check plan card label
      const card = screen.getByTestId(`subscription-plan-${mockPlan.id}`);
      expect(card).toHaveAttribute('aria-label', `${mockPlan.name} subscription plan`);

      // Check features list label
      const featuresList = screen.getByRole('list');
      expect(featuresList).toHaveAttribute('aria-label', `${mockPlan.name} features`);
    });

    it('should support keyboard navigation', async () => {
      renderSubscriptionPlan();
      
      const selectButton = screen.getByRole('button', { 
        name: `Select ${mockPlan.name} plan` 
      });

      // Tab to button
      await userEvent.tab();
      expect(selectButton).toHaveFocus();

      // Activate with keyboard
      await userEvent.keyboard('{Enter}');
      expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable interaction while loading', () => {
      renderSubscriptionPlan({ isLoading: true });
      
      const selectButton = screen.getByRole('button', { 
        name: `Select ${mockPlan.name} plan` 
      });
      expect(selectButton).toBeDisabled();
    });

    it('should show loading state in confirmation dialog', async () => {
      renderSubscriptionPlan();
      
      // Open dialog
      const selectButton = screen.getByRole('button', { 
        name: `Select ${mockPlan.name} plan` 
      });
      await userEvent.click(selectButton);

      // Set loading state
      renderSubscriptionPlan({ isLoading: true });

      const confirmButton = screen.getByRole('button', { name: 'Confirm Change' });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      const errorMessage = 'Failed to update subscription';
      renderSubscriptionPlan({ error: new Error(errorMessage) });
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent(errorMessage);
    });

    it('should allow retry after error', async () => {
      const errorMessage = 'Failed to update subscription';
      renderSubscriptionPlan({ error: new Error(errorMessage) });
      
      // Attempt to select plan again
      const selectButton = screen.getByRole('button', { 
        name: `Select ${mockPlan.name} plan` 
      });
      await userEvent.click(selectButton);

      expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
    });
  });

  describe('Current Plan State', () => {
    it('should show current plan state correctly', () => {
      renderSubscriptionPlan({ isCurrentPlan: true });
      
      const currentPlanButton = screen.getByRole('button', { 
        name: 'Your current plan' 
      });
      expect(currentPlanButton).toBeDisabled();
      expect(currentPlanButton).toHaveTextContent('Current Plan');
    });

    it('should prevent selection of current plan', async () => {
      renderSubscriptionPlan({ isCurrentPlan: true });
      
      const currentPlanButton = screen.getByRole('button', { 
        name: 'Your current plan' 
      });
      await userEvent.click(currentPlanButton);

      expect(mockHandlers.onSelect).not.toHaveBeenCalled();
      expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
    });
  });
});