/**
 * Estate Kit - Dashboard Page Tests
 * 
 * Requirements addressed:
 * - Dashboard Testing (Technical Specifications/3.1 User Interface Design/Critical User Flows)
 *   Ensures the Dashboard page functions as intended, including rendering components and managing state.
 * - State Management Testing (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Validates the integration of Redux slices and custom hooks with the Dashboard page.
 */

// React v18.2.0
import React from 'react';
// @testing-library/react v13.4.0
import { render, screen, waitFor } from '@testing-library/react';
// @reduxjs/toolkit v1.9.5
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Internal imports
import Dashboard from './Dashboard';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import { reducer as documentReducer } from '../../redux/slices/documentSlice';
import { reducer as delegateReducer } from '../../redux/slices/delegateSlice';
import { reducer as subscriptionReducer } from '../../redux/slices/subscriptionSlice';
import useDocument from '../../hooks/useDocument';
import useDelegate from '../../hooks/useDelegate';
import useSubscription from '../../hooks/useSubscription';

// Mock the custom hooks
jest.mock('../../hooks/useDocument');
jest.mock('../../hooks/useDelegate');
jest.mock('../../hooks/useSubscription');

// Mock MainLayout to simplify testing
jest.mock('../../components/layout/MainLayout/MainLayout', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

describe('Dashboard Component', () => {
  // Configure test store
  const store = configureStore({
    reducer: {
      document: documentReducer,
      delegate: delegateReducer,
      subscription: subscriptionReducer
    }
  });

  // Helper function to render Dashboard with required providers
  const renderDashboard = () => {
    return render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock hook implementations
    (useDocument as jest.Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      fetchAllDocuments: jest.fn()
    });

    (useDelegate as jest.Mock).mockReturnValue({
      delegates: [],
      isLoading: false,
      error: null,
      getDelegatesList: jest.fn()
    });

    (useSubscription as jest.Mock).mockReturnValue({
      subscriptions: [],
      loading: false,
      error: null,
      fetchSubscription: jest.fn()
    });
  });

  it('renders the dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('fetches data on component mount', () => {
    renderDashboard();
    
    const { fetchAllDocuments } = useDocument();
    const { getDelegatesList } = useDelegate();
    const { fetchSubscription } = useSubscription();

    expect(fetchAllDocuments).toHaveBeenCalled();
    expect(getDelegatesList).toHaveBeenCalled();
    expect(fetchSubscription).toHaveBeenCalledWith('current');
  });

  it('displays loading states while fetching data', () => {
    // Mock loading states
    (useDocument as jest.Mock).mockReturnValue({
      documents: [],
      loading: true,
      error: null,
      fetchAllDocuments: jest.fn()
    });

    renderDashboard();
    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  it('displays error messages when data fetching fails', () => {
    // Mock error states
    const errorMessage = 'Failed to load documents';
    (useDocument as jest.Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: errorMessage,
      fetchAllDocuments: jest.fn()
    });

    renderDashboard();
    expect(screen.getByText(`Error loading documents: ${errorMessage}`)).toBeInTheDocument();
  });

  it('renders subscription details when available', async () => {
    const mockSubscription = {
      subscriptionId: '123',
      status: 'active',
      startDate: new Date(),
      endDate: new Date()
    };

    (useSubscription as jest.Mock).mockReturnValue({
      subscriptions: [mockSubscription],
      loading: false,
      error: null,
      fetchSubscription: jest.fn()
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Subscription Status')).toBeInTheDocument();
    });
  });

  it('displays no subscription message when none exists', async () => {
    (useSubscription as jest.Mock).mockReturnValue({
      subscriptions: [],
      loading: false,
      error: null,
      fetchSubscription: jest.fn()
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No active subscription found.')).toBeInTheDocument();
    });
  });

  it('renders document list when documents are available', async () => {
    const mockDocuments = [
      { id: '1', title: 'Document 1' },
      { id: '2', title: 'Document 2' }
    ];

    (useDocument as jest.Mock).mockReturnValue({
      documents: mockDocuments,
      loading: false,
      error: null,
      fetchAllDocuments: jest.fn()
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Recent Documents')).toBeInTheDocument();
    });
  });

  it('renders delegate list when delegates are available', async () => {
    const mockDelegates = [
      { id: '1', name: 'Delegate 1' },
      { id: '2', name: 'Delegate 2' }
    ];

    (useDelegate as jest.Mock).mockReturnValue({
      delegates: mockDelegates,
      isLoading: false,
      error: null,
      getDelegatesList: jest.fn()
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Active Delegates')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully for all data fetching', async () => {
    const errorMessage = 'Network error';
    
    // Mock all hooks to return errors
    (useDocument as jest.Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: errorMessage,
      fetchAllDocuments: jest.fn()
    });

    (useDelegate as jest.Mock).mockReturnValue({
      delegates: [],
      isLoading: false,
      error: errorMessage,
      getDelegatesList: jest.fn()
    });

    (useSubscription as jest.Mock).mockReturnValue({
      subscriptions: [],
      loading: false,
      error: errorMessage,
      fetchSubscription: jest.fn()
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText(/Error loading/)).toHaveLength(3);
    });
  });
});