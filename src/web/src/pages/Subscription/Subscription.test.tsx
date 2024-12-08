/**
 * Estate Kit - Subscription Page Tests
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Validates the functionality of subscription management features through comprehensive testing.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and functionality through component testing.
 */

// @testing-library/react version ^14.0.0
import { render, screen, fireEvent } from '@testing-library/react';
// redux-mock-store version ^1.5.4
import configureStore from 'redux-mock-store';
// react-redux version ^8.1.2
import { Provider } from 'react-redux';

// Internal imports
import SubscriptionPage from './Subscription';
import SubscriptionPlan from '../../components/subscription/SubscriptionPlan/SubscriptionPlan';
import SubscriptionCard from '../../components/subscription/SubscriptionCard/SubscriptionCard';
import { fetchSubscription, updateSubscription } from '../../redux/slices/subscriptionSlice';
import useSubscription from '../../hooks/useSubscription';

// Mock the custom hook
jest.mock('../../hooks/useSubscription');

// Configure mock store
const mockStore = configureStore([]);

describe('SubscriptionPage', () => {
  // Mock subscription data
  const mockSubscriptions = [
    {
      subscriptionId: '123',
      userId: 'user123',
      plan: 'Premium',
      status: 'active',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-01-01')
    }
  ];

  // Mock store with initial state
  const store = mockStore({
    subscription: {
      subscriptions: mockSubscriptions,
      loading: false,
      error: null
    }
  });

  // Mock useSubscription hook implementation
  beforeEach(() => {
    (useSubscription as jest.Mock).mockImplementation(() => ({
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      fetchSubscription: jest.fn(),
      updateSubscription: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    store.clearActions();
  });

  it('renders subscription page with all components', () => {
    render(
      <Provider store={store}>
        <SubscriptionPage />
      </Provider>
    );

    // Verify page title is rendered
    expect(screen.getByText('Subscription Management')).toBeInTheDocument();

    // Verify subscription card is rendered
    expect(screen.getByRole('region', { name: /subscription details/i })).toBeInTheDocument();

    // Verify plan information is displayed
    expect(screen.getByText('Premium')).toBeInTheDocument();

    // Verify status badge is rendered
    expect(screen.getByRole('status')).toHaveTextContent('Active');
  });

  it('handles loading state correctly', () => {
    (useSubscription as jest.Mock).mockImplementation(() => ({
      subscriptions: [],
      loading: true,
      error: null,
      fetchSubscription: jest.fn(),
      updateSubscription: jest.fn()
    }));

    render(
      <Provider store={store}>
        <SubscriptionPage />
      </Provider>
    );

    expect(screen.getByText('Loading subscription details...')).toBeInTheDocument();
  });

  it('handles error state correctly', () => {
    const errorMessage = 'Failed to load subscription';
    (useSubscription as jest.Mock).mockImplementation(() => ({
      subscriptions: [],
      loading: false,
      error: errorMessage,
      fetchSubscription: jest.fn(),
      updateSubscription: jest.fn()
    }));

    render(
      <Provider store={store}>
        <SubscriptionPage />
      </Provider>
    );

    expect(screen.getByText(`Error loading subscription details: ${errorMessage}`)).toBeInTheDocument();
  });

  it('handles subscription renewal correctly', async () => {
    const mockUpdateSubscription = jest.fn();
    (useSubscription as jest.Mock).mockImplementation(() => ({
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      fetchSubscription: jest.fn(),
      updateSubscription: mockUpdateSubscription
    }));

    render(
      <Provider store={store}>
        <SubscriptionPage />
      </Provider>
    );

    // Find and click the renew button
    const renewButton = screen.getByRole('button', { name: /renew subscription/i });
    fireEvent.click(renewButton);

    // Verify update function was called with correct parameters
    expect(mockUpdateSubscription).toHaveBeenCalledWith('123', 'active');
  });

  it('handles subscription cancellation correctly', async () => {
    const mockUpdateSubscription = jest.fn();
    (useSubscription as jest.Mock).mockImplementation(() => ({
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      fetchSubscription: jest.fn(),
      updateSubscription: mockUpdateSubscription
    }));

    render(
      <Provider store={store}>
        <SubscriptionPage />
      </Provider>
    );

    // Find and click the cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel subscription/i });
    fireEvent.click(cancelButton);

    // Verify update function was called with correct parameters
    expect(mockUpdateSubscription).toHaveBeenCalledWith('123', 'cancelled');
  });

  it('fetches subscription data on mount', () => {
    const mockFetchSubscription = jest.fn();
    (useSubscription as jest.Mock).mockImplementation(() => ({
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      fetchSubscription: mockFetchSubscription,
      updateSubscription: jest.fn()
    }));

    render(
      <Provider store={store}>
        <SubscriptionPage />
      </Provider>
    );

    // Verify fetch function was called
    expect(mockFetchSubscription).toHaveBeenCalledWith('current');
  });

  it('handles plan selection correctly', () => {
    const mockUpdateSubscription = jest.fn();
    (useSubscription as jest.Mock).mockImplementation(() => ({
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      fetchSubscription: jest.fn(),
      updateSubscription: mockUpdateSubscription
    }));

    render(
      <Provider store={store}>
        <SubscriptionPage />
      </Provider>
    );

    // Find and click a plan selection button
    const planButton = screen.getByRole('button', { name: /select plan/i });
    fireEvent.click(planButton);

    // Verify update function was called with correct parameters
    expect(mockUpdateSubscription).toHaveBeenCalledWith('123', 'active');
  });
});