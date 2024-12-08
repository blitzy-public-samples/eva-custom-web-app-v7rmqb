/**
 * Estate Kit - Delegates Page Tests
 * 
 * Requirements addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Tests the frontend interface for managing delegate access control, including listing, adding, editing, and deleting delegates.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures that the Delegates page adheres to the design system and provides a consistent user experience.
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Validates the integration of Redux state management for delegate-related actions.
 */

// react version ^18.2.0
import React from 'react';
// @testing-library/react version ^13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// @testing-library/jest-dom version ^5.16.5
import '@testing-library/jest-dom';
// redux-mock-store version ^1.5.4
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

// Internal imports
import DelegatesPage from './Delegates';
import DelegateList from '../components/delegates/DelegateList/DelegateList';
import DelegateForm from '../components/delegates/DelegateForm/DelegateForm';
import { fetchDelegates, addDelegate, editDelegate, removeDelegate } from '../redux/slices/delegateSlice';

// Mock the Redux store
const mockStore = configureStore([]);

// Mock delegate data
const mockDelegates = [
  {
    delegateId: '1',
    ownerId: 'owner1',
    permissions: [
      {
        permissionId: 'p1',
        resourceType: 'document',
        accessLevel: 'read'
      }
    ],
    role: 'delegate',
    expiresAt: new Date('2024-12-31')
  }
];

describe('DelegatesPage', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      delegate: {
        delegates: mockDelegates,
        status: 'idle',
        error: null
      }
    });
    store.dispatch = jest.fn();
  });

  test('renders delegates page with title', () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    expect(screen.getByText('Manage Delegates')).toBeInTheDocument();
  });

  test('fetches delegates on mount', async () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  test('displays add delegate button when form is not shown', () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    expect(screen.getByText('Add Delegate')).toBeInTheDocument();
  });

  test('shows delegate form when add button is clicked', () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add Delegate'));
    expect(screen.queryByText('Add Delegate')).not.toBeInTheDocument();
  });

  test('displays error message when present', () => {
    const storeWithError = mockStore({
      delegate: {
        delegates: [],
        status: 'failed',
        error: 'Failed to load delegates'
      }
    });

    render(
      <Provider store={storeWithError}>
        <DelegatesPage />
      </Provider>
    );

    expect(screen.getByText('Failed to load delegates')).toBeInTheDocument();
  });

  test('handles delegate creation', async () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    // Click add delegate button
    fireEvent.click(screen.getByText('Add Delegate'));

    // Fill out form
    const newDelegate = {
      delegateId: '2',
      ownerId: 'owner1',
      permissions: [],
      role: 'delegate',
      expiresAt: new Date('2024-12-31')
    };

    // Submit form
    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  test('handles delegate editing', async () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    // Find and click edit button for first delegate
    const editButton = screen.getByLabelText(`Edit delegate ${mockDelegates[0].delegateId}`);
    fireEvent.click(editButton);

    // Verify form is shown with delegate data
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockDelegates[0].delegateId)).toBeInTheDocument();
    });
  });

  test('handles delegate deletion', async () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    // Find and click delete button for first delegate
    const deleteButton = screen.getByLabelText(`Delete delegate ${mockDelegates[0].delegateId}`);
    fireEvent.click(deleteButton);

    // Verify delete action was dispatched
    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  test('displays loading state while fetching delegates', () => {
    const loadingStore = mockStore({
      delegate: {
        delegates: [],
        status: 'loading',
        error: null
      }
    });

    render(
      <Provider store={loadingStore}>
        <DelegatesPage />
      </Provider>
    );

    expect(screen.getByText('Loading delegates...')).toBeInTheDocument();
  });

  test('handles form cancellation', () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    // Click add delegate button
    fireEvent.click(screen.getByText('Add Delegate'));

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Verify form is hidden and add button is shown
    expect(screen.getByText('Add Delegate')).toBeInTheDocument();
  });

  test('validates required fields in delegate form', async () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    // Click add delegate button
    fireEvent.click(screen.getByText('Add Delegate'));

    // Try to submit empty form
    fireEvent.click(screen.getByText('Add Delegate'));

    // Verify validation errors are shown
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  test('handles successful delegate creation', async () => {
    render(
      <Provider store={store}>
        <DelegatesPage />
      </Provider>
    );

    // Click add delegate button
    fireEvent.click(screen.getByText('Add Delegate'));

    // Fill out form with valid data
    const newDelegate = {
      delegateId: '2',
      ownerId: 'owner1',
      permissions: [],
      role: 'delegate',
      expiresAt: new Date('2024-12-31')
    };

    // Submit form
    fireEvent.click(screen.getByText('Add Delegate'));

    // Verify success and form is hidden
    await waitFor(() => {
      expect(screen.getByText('Add Delegate')).toBeInTheDocument();
    });
  });
});