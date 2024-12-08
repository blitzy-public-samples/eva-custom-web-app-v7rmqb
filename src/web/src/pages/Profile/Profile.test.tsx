/**
 * Estate Kit - Profile Page Tests
 * 
 * Human Tasks:
 * 1. Verify test coverage meets project requirements
 * 2. Test accessibility compliance with screen readers
 * 3. Validate form submission error scenarios
 * 4. Review Redux state management test cases
 */

// React v18.2.0
import React from 'react';
// @testing-library/react v14.0.0
import { render, fireEvent } from '@testing-library/react';
// react-redux v8.0.5
import { Provider } from 'react-redux';

// Internal imports
import Profile from './Profile';
import ProfileForm from '../components/profile/ProfileForm/ProfileForm';
import { mockApiRequest } from '../../utils/test.util';
import store from '../../redux/store';
import { actions } from '../../redux/slices/authSlice';

/**
 * Test suite for Profile page component
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements comprehensive tests for the Profile page functionality
 * - User Profile Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Ensures proper functionality of profile update features
 */
describe('Profile Page', () => {
  // Mock auth state
  const mockAuthState = {
    user: 'test@example.com',
    token: 'mock-token',
    role: 'user',
    isAuthenticated: true
  };

  // Setup before each test
  beforeEach(() => {
    // Reset store and set initial auth state
    store.dispatch(actions.login({
      email: mockAuthState.user,
      token: mockAuthState.token,
      role: mockAuthState.role as 'user' | 'admin' | 'delegate'
    }));
  });

  /**
   * Test Profile page rendering
   * Verifies that the Profile page renders correctly with all required components
   */
  describe('Profile Rendering', () => {
    it('should render the Profile page with header', () => {
      const { getByText } = render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      expect(getByText('Profile Settings')).toBeInTheDocument();
    });

    it('should render the ProfileForm component', () => {
      const { container } = render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should display user information', () => {
      const { getByText } = render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      expect(getByText(`Email: ${mockAuthState.user}`)).toBeInTheDocument();
      expect(getByText(`Role: ${mockAuthState.role}`)).toBeInTheDocument();
    });
  });

  /**
   * Test Profile form submission
   * Verifies that form submissions update the Redux state correctly
   */
  describe('Profile Form Submission', () => {
    it('should handle successful profile update', async () => {
      // Mock API request
      const mockResponse = {
        email: 'updated@example.com',
        role: 'user',
        token: mockAuthState.token
      };

      mockApiRequest({
        url: '/profile/update',
        method: 'POST',
        data: mockResponse,
        status: 200
      });

      const { getByLabelText, getByText } = render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      // Fill form
      const emailInput = getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

      // Submit form
      const submitButton = getByText('Update Profile');
      fireEvent.click(submitButton);

      // Verify Redux state update
      const updatedState = store.getState().auth;
      expect(updatedState.user).toBe('updated@example.com');
    });

    it('should handle profile update error', async () => {
      // Mock API error
      mockApiRequest({
        url: '/profile/update',
        method: 'POST',
        status: 400,
        data: { message: 'Update failed' }
      });

      const { getByLabelText, getByText } = render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      // Fill form with invalid data
      const emailInput = getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      // Submit form
      const submitButton = getByText('Update Profile');
      fireEvent.click(submitButton);

      // Verify error message
      expect(getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  /**
   * Test authentication redirection
   * Verifies that unauthenticated users are redirected to login
   */
  describe('Authentication Check', () => {
    it('should redirect to login when not authenticated', () => {
      // Mock window.location
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      // Reset auth state
      store.dispatch(actions.logout());

      render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      expect(window.location.href).toBe('/login');
    });
  });

  /**
   * Test accessibility requirements
   * Verifies that the Profile page meets accessibility standards
   */
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { getByRole } = render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      expect(getByRole('form')).toHaveAttribute('aria-label', 'Profile Update Form');
    });

    it('should maintain focus management', () => {
      const { getByLabelText } = render(
        <Provider store={store}>
          <Profile />
        </Provider>
      );

      const emailInput = getByLabelText('Email Address');
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
    });
  });
});