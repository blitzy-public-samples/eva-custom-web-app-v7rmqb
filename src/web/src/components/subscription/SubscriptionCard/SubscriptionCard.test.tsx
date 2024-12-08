/**
 * Test suite for the SubscriptionCard component
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements test cases to validate the functionality and rendering of the SubscriptionCard component.
 */

// @testing-library/react version ^13.4.0
import { render, screen, fireEvent } from '@testing-library/react';
// jest version ^29.0.0
import '@testing-library/jest-dom';
import React from 'react';

// Internal imports
import SubscriptionCard from './SubscriptionCard';
import { mockApiRequest } from '../../utils/test.util';
import { theme } from '../../config/theme.config';
import { SubscriptionTypes } from '../../types/subscription.types';

describe('SubscriptionCard Component', () => {
  // Mock subscription data
  const mockSubscription: SubscriptionTypes = {
    subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    plan: 'Premium Plan',
    status: 'active',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2024-01-01')
  };

  // Mock callback functions
  const mockOnRenew = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders subscription details correctly', () => {
    render(
      <SubscriptionCard
        subscription={mockSubscription}
        onRenew={mockOnRenew}
        onCancel={mockOnCancel}
      />
    );

    // Verify plan information is displayed
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();

    // Verify status is displayed with correct formatting
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveStyle({
      backgroundColor: `${theme.palette.primary.main}20`
    });

    // Verify dates are displayed
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('applies correct theme styles', () => {
    render(
      <SubscriptionCard
        subscription={mockSubscription}
        onRenew={mockOnRenew}
        onCancel={mockOnCancel}
      />
    );

    // Verify card container styles
    const cardContainer = screen.getByRole('region');
    expect(cardContainer).toHaveStyle({
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.primary.main}`
    });

    // Verify status badge styles for active status
    const statusBadge = screen.getByRole('status');
    expect(statusBadge).toHaveStyle({
      backgroundColor: `${theme.palette.primary.main}20`,
      color: theme.palette.primary.main
    });
  });

  it('handles button clicks correctly', () => {
    render(
      <SubscriptionCard
        subscription={mockSubscription}
        onRenew={mockOnRenew}
        onCancel={mockOnCancel}
      />
    );

    // Test renew button
    const renewButton = screen.getByRole('button', { name: /renew your subscription/i });
    fireEvent.click(renewButton);
    expect(mockOnRenew).toHaveBeenCalledTimes(1);

    // Test cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel your subscription/i });
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('conditionally renders buttons based on subscription status', () => {
    // Test with cancelled subscription
    const cancelledSubscription = { ...mockSubscription, status: 'cancelled' as const };
    render(
      <SubscriptionCard
        subscription={cancelledSubscription}
        onRenew={mockOnRenew}
        onCancel={mockOnCancel}
      />
    );

    // Verify renew button is not present for cancelled subscription
    expect(screen.queryByRole('button', { name: /renew your subscription/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel your subscription/i })).not.toBeInTheDocument();

    // Test with inactive subscription
    const inactiveSubscription = { ...mockSubscription, status: 'inactive' as const };
    render(
      <SubscriptionCard
        subscription={inactiveSubscription}
        onRenew={mockOnRenew}
        onCancel={mockOnCancel}
      />
    );

    // Verify only renew button is present for inactive subscription
    expect(screen.getByRole('button', { name: /renew your subscription/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel your subscription/i })).not.toBeInTheDocument();
  });

  it('handles API integration correctly', async () => {
    // Mock API request
    const mockResponse = {
      data: { success: true },
      status: 200
    };

    mockApiRequest({
      url: '/api/subscriptions/renew',
      method: 'POST',
      data: { subscriptionId: mockSubscription.subscriptionId },
      status: 200,
      delay: 100
    });

    render(
      <SubscriptionCard
        subscription={mockSubscription}
        onRenew={mockOnRenew}
        onCancel={mockOnCancel}
      />
    );

    // Simulate renew button click
    const renewButton = screen.getByRole('button', { name: /renew your subscription/i });
    fireEvent.click(renewButton);

    // Verify API request was made
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/subscriptions/renew',
        method: 'POST'
      })
    );
  });

  it('meets accessibility requirements', () => {
    render(
      <SubscriptionCard
        subscription={mockSubscription}
        onRenew={mockOnRenew}
        onCancel={mockOnCancel}
      />
    );

    // Verify ARIA labels are present
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Subscription Details');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /renew your subscription/i })).toHaveAttribute('aria-label');
    expect(screen.getByRole('button', { name: /cancel your subscription/i })).toHaveAttribute('aria-label');
  });
});