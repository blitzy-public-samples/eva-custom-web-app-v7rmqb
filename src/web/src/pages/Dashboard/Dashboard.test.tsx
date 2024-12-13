/**
 * Dashboard Component Test Suite
 * Version: 1.0.0
 * 
 * Comprehensive test suite for the Dashboard component ensuring proper functionality,
 * accessibility compliance, and user interactions.
 * 
 * @package @testing-library/react ^14.0.0
 * @package @jest/globals ^29.0.0
 * @package @axe-core/react ^4.7.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { axe, toHaveNoViolations } from '@axe-core/react';
import Dashboard from './Dashboard';
import { renderWithProviders } from '../../utils/test.util';
import { UserRole, UserStatus } from '../../../backend/src/types/user.types';
import { DocumentType, DocumentStatus } from '../../types/document.types';
import { DelegateRole, DelegateStatus } from '../../types/delegate.types';
import { SubscriptionPlan, SubscriptionStatus } from '../../types/subscription.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../hooks/useDocument', () => ({
  useDocument: jest.fn()
}));

jest.mock('../../hooks/useDelegate', () => ({
  useDelegate: jest.fn()
}));

jest.mock('../../hooks/useSubscription', () => ({
  useSubscription: jest.fn()
}));

// Mock data
const mockUser = {
  id: '123',
  name: 'John Smith',
  email: 'john@example.com',
  role: UserRole.OWNER,
  status: UserStatus.ACTIVE
};

const mockDocuments = [
  {
    id: 'doc1',
    title: 'Medical Directive',
    type: DocumentType.MEDICAL,
    status: DocumentStatus.COMPLETED,
    metadata: {
      fileName: 'medical_directive.pdf',
      fileSize: 1024 * 1024, // 1MB
      lastModified: new Date('2024-02-15').toISOString()
    }
  }
];

const mockDelegates = [
  {
    id: 'del1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: DelegateRole.EXECUTOR,
    status: DelegateStatus.ACTIVE,
    lastAccess: new Date('2024-02-14').toISOString()
  }
];

const mockSubscription = {
  id: 'sub1',
  plan: SubscriptionPlan.PREMIUM,
  status: SubscriptionStatus.ACTIVE,
  startDate: new Date('2024-01-01'),
  nextBillingDate: new Date('2024-03-01')
};

describe('Dashboard Component', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup auth mock
    require('../../hooks/useAuth').useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false
    });

    // Setup document mock
    require('../../hooks/useDocument').useDocument.mockReturnValue({
      documents: mockDocuments,
      loading: false,
      error: null
    });

    // Setup delegate mock
    require('../../hooks/useDelegate').useDelegate.mockReturnValue({
      delegates: mockDelegates,
      loading: false,
      error: null
    });

    // Setup subscription mock
    require('../../hooks/useSubscription').useSubscription.mockReturnValue({
      subscription: mockSubscription,
      loading: false,
      error: null
    });
  });

  // Cleanup after each test
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders dashboard content correctly', async () => {
    const { container } = renderWithProviders(<Dashboard />);

    // Verify welcome message
    expect(screen.getByText(/Welcome back, John Smith/i)).toBeInTheDocument();

    // Verify document section
    const documentSection = screen.getByRole('region', { name: /Recent Documents/i });
    expect(documentSection).toBeInTheDocument();
    expect(within(documentSection).getByText('Medical Directive')).toBeInTheDocument();
    expect(within(documentSection).getByText(/1MB/)).toBeInTheDocument();

    // Verify delegate section
    const delegateSection = screen.getByRole('region', { name: /Active Delegates/i });
    expect(delegateSection).toBeInTheDocument();
    expect(within(delegateSection).getByText('Sarah Johnson')).toBeInTheDocument();
    expect(within(delegateSection).getByText(/Executor/)).toBeInTheDocument();

    // Verify subscription section
    const subscriptionSection = screen.getByRole('region', { name: /Your Subscription/i });
    expect(subscriptionSection).toBeInTheDocument();
    expect(within(subscriptionSection).getByText(/Premium Plan/)).toBeInTheDocument();
    expect(within(subscriptionSection).getByText(/March 1, 2024/)).toBeInTheDocument();

    // Verify accessibility
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('handles loading states correctly', async () => {
    // Mock loading states
    require('../../hooks/useDocument').useDocument.mockReturnValue({
      documents: [],
      loading: true,
      error: null
    });

    renderWithProviders(<Dashboard />);

    // Verify loading indicators
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    expect(screen.getByText(/Loading your dashboard/i)).toBeInTheDocument();
  });

  it('handles error states correctly', async () => {
    // Mock error state
    const errorMessage = 'Failed to load dashboard data';
    require('../../hooks/useDocument').useDocument.mockReturnValue({
      documents: [],
      loading: false,
      error: new Error(errorMessage)
    });

    const onError = jest.fn();
    renderWithProviders(<Dashboard onError={onError} />);

    // Verify error display
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('handles navigation correctly', async () => {
    const { history } = renderWithProviders(<Dashboard />);

    // Click upload document button
    fireEvent.click(screen.getByText(/Upload New Document/i));
    await waitFor(() => {
      expect(history.location.pathname).toBe('/documents/upload');
    });

    // Click add delegate button
    fireEvent.click(screen.getByText(/Add New Delegate/i));
    await waitFor(() => {
      expect(history.location.pathname).toBe('/delegates/add');
    });
  });

  it('meets accessibility requirements', async () => {
    const { container } = renderWithProviders(<Dashboard />);

    // Test keyboard navigation
    const uploadButton = screen.getByText(/Upload New Document/i);
    uploadButton.focus();
    expect(document.activeElement).toBe(uploadButton);

    // Test ARIA landmarks
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(3); // Documents, Delegates, Subscription

    // Test heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveTextContent(/Welcome back/i);
    expect(headings[1]).toHaveTextContent(/Recent Documents/i);
    expect(headings[2]).toHaveTextContent(/Active Delegates/i);

    // Run full accessibility audit
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});