/**
 * Estate Kit - Settings Page Tests
 * 
 * Human Tasks:
 * 1. Verify test coverage meets project requirements
 * 2. Test with different screen readers for accessibility
 * 3. Validate form submission with various input scenarios
 * 4. Review error handling test cases with QA team
 */

// React v18.2.0
import React from 'react';
// @testing-library/react v13.4.0
import { render, screen, fireEvent } from '@testing-library/react';
// react-redux v8.0.5
import { Provider } from 'react-redux';

// Internal imports
import Settings from './Settings';
import ProfileForm from '../../components/profile/ProfileForm/ProfileForm';
import store from '../../redux/store';
import { actions, selectAuthState } from '../../redux/slices/authSlice';
import { mockApiRequest } from '../../utils/test.util';

/**
 * Test suite for the Settings page component
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements comprehensive tests for the Settings page functionality
 * - User Profile Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Validates profile update functionality and form behavior
 */
describe('Settings Page', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset mock API calls
    jest.clearAllMocks();
    
    // Reset Redux store
    store.dispatch(actions.logout());
  });

  /**
   * Tests if the Settings page renders correctly with all its components
   */
  it('should render the Settings page with all components', () => {
    render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    // Verify page title is rendered
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your profile information and account preferences')).toBeInTheDocument();

    // Verify sections are rendered
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Authentication Preferences')).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();

    // Verify ProfileForm component is rendered
    expect(screen.getByRole('form', { name: /Profile Update Form/i })).toBeInTheDocument();
  });

  /**
   * Tests the accessibility of the Settings page
   */
  it('should meet accessibility requirements', () => {
    const { container } = render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    // Verify ARIA labels are present
    expect(screen.getByRole('region', { name: 'Authentication settings' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Notification settings' })).toBeInTheDocument();

    // Verify heading hierarchy
    const headings = container.querySelectorAll('h1, h2');
    expect(headings[0].tagName).toBe('H1'); // Main title
    expect(headings[1].tagName).toBe('H2'); // Section titles
  });

  /**
   * Tests the profile form submission functionality
   */
  it('should handle profile form submission correctly', async () => {
    // Mock API request
    const mockProfileUpdate = mockApiRequest({
      url: '/profile/update',
      method: 'POST',
      data: {
        email: 'test@example.com',
        role: 'user'
      }
    });

    render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    // Fill out the profile form
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);

    // Verify API call was made
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com'
      })
    );

    // Verify Redux store was updated
    const authState = selectAuthState(store.getState());
    expect(authState.user).toBe('test@example.com');
  });

  /**
   * Tests error handling in the profile form
   */
  it('should handle profile form errors correctly', async () => {
    // Mock API request with error
    const mockProfileUpdate = mockApiRequest({
      url: '/profile/update',
      method: 'POST',
      status: 400,
      data: {
        error: 'Invalid email format'
      }
    });

    render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    // Submit form with invalid data
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);

    // Verify error message is displayed
    expect(await screen.findByText('Invalid email format')).toBeInTheDocument();
  });

  /**
   * Tests the responsive design of the Settings page
   */
  it('should render correctly on different screen sizes', () => {
    const { container } = render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    // Test mobile viewport
    window.innerWidth = 375;
    fireEvent(window, new Event('resize'));
    expect(container.querySelector('.container')).toHaveStyle({
      padding: '16px'
    });

    // Test desktop viewport
    window.innerWidth = 1024;
    fireEvent(window, new Event('resize'));
    expect(container.querySelector('.container')).toHaveStyle({
      padding: '32px'
    });
  });

  /**
   * Tests the theme consistency of the Settings page
   */
  it('should apply consistent theme styles', () => {
    const { container } = render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    // Verify theme colors are applied correctly
    const header = container.querySelector('header');
    expect(header).toHaveStyle({
      color: '#333' // theme.palette.text.primary
    });

    // Verify typography styles
    const title = screen.getByText('Account Settings');
    expect(title).toHaveStyle({
      fontSize: '2.25rem' // theme.typography.h4.fontSize
    });
  });
});