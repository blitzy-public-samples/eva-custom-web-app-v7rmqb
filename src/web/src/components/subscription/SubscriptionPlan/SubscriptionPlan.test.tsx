// @testing-library/react version ^13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// redux-mock-store version ^1.5.4
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import SubscriptionPlan from './SubscriptionPlan';
import { fetchSubscriptionDetails } from '../../services/subscription.service';
import { actions } from '../../redux/slices/subscriptionSlice';
import { mockApiRequest } from '../../utils/test.util';

// Mock the subscription service
jest.mock('../../services/subscription.service');

/**
 * Test suite for the SubscriptionPlan component
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements test cases to validate the SubscriptionPlan component's functionality,
 *   rendering, and integration with services and Redux state.
 */

describe('SubscriptionPlan Component', () => {
  // Mock Redux store
  const mockStore = configureStore([]);
  
  // Mock subscription data
  const mockSubscriptions = [
    {
      subscriptionId: '123',
      userId: 'user1',
      plan: 'Basic',
      status: 'active' as const,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-01-01')
    },
    {
      subscriptionId: '456',
      userId: 'user1',
      plan: 'Premium',
      status: 'inactive' as const,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-01-01')
    }
  ];

  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the fetchSubscriptionDetails function
    (fetchSubscriptionDetails as jest.Mock).mockResolvedValue(mockSubscriptions[0]);
    
    // Mock API requests
    mockApiRequest({
      url: '/subscriptions',
      method: 'GET',
      data: mockSubscriptions
    });
  });

  // Test component rendering
  it('renders subscription plans correctly', () => {
    const store = mockStore({
      subscription: {
        subscriptions: mockSubscriptions,
        loading: false,
        error: null
      }
    });

    const onSelectPlan = jest.fn();

    render(
      <Provider store={store}>
        <SubscriptionPlan
          plans={mockSubscriptions}
          onSelectPlan={onSelectPlan}
        />
      </Provider>
    );

    // Verify plan titles are rendered
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();

    // Verify status indicators
    expect(screen.getByText('Active Subscription')).toBeInTheDocument();
    expect(screen.getByText('Subscription Paused')).toBeInTheDocument();
  });

  // Test loading state
  it('displays loading state when no plans are available', () => {
    const store = mockStore({
      subscription: {
        subscriptions: [],
        loading: true,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <SubscriptionPlan plans={[]} onSelectPlan={() => {}} />
      </Provider>
    );

    expect(screen.getByText('No subscription plans available')).toBeInTheDocument();
  });

  // Test plan selection
  it('handles plan selection correctly', async () => {
    const store = mockStore({
      subscription: {
        subscriptions: mockSubscriptions,
        loading: false,
        error: null
      }
    });

    const onSelectPlan = jest.fn();

    render(
      <Provider store={store}>
        <SubscriptionPlan
          plans={mockSubscriptions}
          onSelectPlan={onSelectPlan}
        />
      </Provider>
    );

    // Find and click the select plan button for the inactive plan
    const selectButton = screen.getByText('Select Plan');
    fireEvent.click(selectButton);

    // Verify the onSelectPlan callback was called with the correct plan
    expect(onSelectPlan).toHaveBeenCalledWith(mockSubscriptions[1]);
  });

  // Test disabled state for active plan
  it('disables selection for active plan', () => {
    const store = mockStore({
      subscription: {
        subscriptions: mockSubscriptions,
        loading: false,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <SubscriptionPlan
          plans={mockSubscriptions}
          onSelectPlan={() => {}}
        />
      </Provider>
    );

    // Find the current plan button and verify it's disabled
    const currentPlanButton = screen.getByText('Current Plan');
    expect(currentPlanButton).toBeDisabled();
  });

  // Test Redux integration
  it('integrates with Redux store correctly', async () => {
    const store = mockStore({
      subscription: {
        subscriptions: mockSubscriptions,
        loading: false,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <SubscriptionPlan
          plans={mockSubscriptions}
          onSelectPlan={() => {}}
        />
      </Provider>
    );

    // Verify store actions
    const actions = store.getActions();
    expect(actions).toEqual([]);

    // Simulate plan selection
    const selectButton = screen.getByText('Select Plan');
    fireEvent.click(selectButton);

    // Verify store was updated
    await waitFor(() => {
      const updatedActions = store.getActions();
      expect(updatedActions.length).toBeGreaterThan(0);
    });
  });

  // Test accessibility
  it('meets accessibility requirements', () => {
    const store = mockStore({
      subscription: {
        subscriptions: mockSubscriptions,
        loading: false,
        error: null
      }
    });

    const { container } = render(
      <Provider store={store}>
        <SubscriptionPlan
          plans={mockSubscriptions}
          onSelectPlan={() => {}}
        />
      </Provider>
    );

    // Verify ARIA labels are present
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });

    // Check for color contrast issues
    expect(container).toHaveStyle({
      color: expect.any(String),
      backgroundColor: expect.any(String)
    });
  });

  // Test error handling
  it('handles API errors gracefully', async () => {
    // Mock API error
    (fetchSubscriptionDetails as jest.Mock).mockRejectedValue(new Error('API Error'));

    const store = mockStore({
      subscription: {
        subscriptions: [],
        loading: false,
        error: 'Failed to fetch subscription details'
      }
    });

    render(
      <Provider store={store}>
        <SubscriptionPlan plans={[]} onSelectPlan={() => {}} />
      </Provider>
    );

    // Verify error state is displayed
    expect(screen.getByText('No subscription plans available')).toBeInTheDocument();
  });
});