/**
 * Estate Kit - ProfileForm Component Tests
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and reliability of the ProfileForm component.
 * 
 * Human Tasks:
 * 1. Verify test coverage meets project requirements
 * 2. Review error message assertions with UX team
 * 3. Validate form submission test cases with backend team
 */

// React v18.2.0
import React from 'react';

// @testing-library/react v13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// @testing-library/jest-dom v5.16.5
import '@testing-library/jest-dom';

// Internal imports
import ProfileForm from './ProfileForm';
import { mockApiRequest } from '../../utils/test.util';
import { API_BASE_URL } from '../../config/api.config';
import useAuth from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock API request utility
jest.mock('../../utils/test.util', () => ({
  mockApiRequest: jest.fn()
}));

describe('ProfileForm Component', () => {
  // Common test setup
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useAuth hook implementation
    (useAuth as jest.Mock).mockImplementation(() => ({
      isAuthenticated: true,
      userRole: 'user',
      getToken: () => 'mock-token'
    }));
  });

  describe('Rendering', () => {
    test('renders all form elements correctly', () => {
      render(<ProfileForm />);

      // Verify form elements are present
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
      expect(screen.getByText(/update profile/i)).toBeInTheDocument();
    });

    test('renders with correct initial state', () => {
      render(<ProfileForm />);

      // Check initial form values
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const roleInput = screen.getByLabelText(/role/i) as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(roleInput.value).toBe('user');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('renders with proper accessibility attributes', () => {
      render(<ProfileForm />);

      // Verify accessibility attributes
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Profile Update Form');
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/role/i)).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Validation', () => {
    test('displays error for invalid email', async () => {
      render(<ProfileForm />);

      // Enter invalid email
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    test('displays error for empty required fields', async () => {
      render(<ProfileForm />);

      // Submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(submitButton);

      // Verify error messages
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    test('clears errors when valid input is provided', async () => {
      render(<ProfileForm />);

      // Enter invalid email and trigger error
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Enter valid email
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      fireEvent.blur(emailInput);

      // Verify error is cleared
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid data successfully', async () => {
      // Mock successful API response
      (mockApiRequest as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
        status: 200
      });

      render(<ProfileForm />);

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/role/i), {
        target: { value: 'user' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      // Verify API call
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith({
          url: `${API_BASE_URL}/profile/update`,
          method: 'POST',
          data: {
            email: 'test@example.com',
            role: 'user'
          }
        });
      });
    });

    test('handles submission errors appropriately', async () => {
      // Mock API error response
      (mockApiRequest as jest.Mock).mockRejectedValueOnce({
        response: {
          data: { message: 'Failed to update profile' },
          status: 400
        }
      });

      render(<ProfileForm />);

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/role/i), {
        target: { value: 'user' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
      });
    });

    test('disables submit button during submission', async () => {
      // Mock delayed API response
      (mockApiRequest as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<ProfileForm />);

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(submitButton);

      // Verify button is disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });
  });
});