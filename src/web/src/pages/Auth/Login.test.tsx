/**
 * Estate Kit - Login Page Tests
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Tests the login functionality to ensure users can authenticate and access the application.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures the Login page adheres to the design system and renders correctly.
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements test cases to validate the functionality and reliability of the Login page.
 */

// react version ^18.2.0
import React from 'react';
// @testing-library/react version ^13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// jest version ^29.0.0
import '@testing-library/jest-dom';

// Internal imports
import Login from './Login';
import PublicRoute from '../../routes/PublicRoute';
import { mockApiRequest } from '../../utils/test.util';
import { AuthTypes } from '../../types/auth.types';

// Mock the auth service
jest.mock('../../services/auth.service', () => ({
  login: jest.fn(),
  initializeAuth0: jest.fn()
}));

// Mock the validation utility
jest.mock('../../utils/validation.util', () => ({
  validateAuth: jest.fn().mockReturnValue(true)
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders login form with all required elements', () => {
      render(<Login />);

      // Verify form elements are present
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByText(/welcome to estate kit/i)).toBeInTheDocument();
    });

    test('renders within PublicRoute component', () => {
      render(
        <PublicRoute>
          <Login />
        </PublicRoute>
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('displays error for invalid email format', async () => {
      render(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please enter a valid email address/i);
      });
    });

    test('displays error for empty required fields', async () => {
      render(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.blur(emailInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getAllByRole('alert')).toHaveLength(2);
        expect(screen.getAllByText(/this field is required/i)).toHaveLength(2);
      });
    });

    test('clears validation errors when user starts typing', async () => {
      render(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      // Trigger validation error
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Start typing
      fireEvent.change(emailInput, { target: { value: 'test@' } });

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Login Functionality', () => {
    const validCredentials: Pick<AuthTypes, 'email' | 'password'> = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    test('handles successful login attempt', async () => {
      // Mock successful API response
      mockApiRequest({
        url: '/auth/login',
        method: 'POST',
        data: { token: 'mock-token' },
        status: 200
      });

      render(<Login />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: validCredentials.email }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: validCredentials.password }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();

      await waitFor(() => {
        // Verify redirect attempt
        expect(window.location.href).toContain('/dashboard');
      });
    });

    test('handles failed login attempt', async () => {
      // Mock failed API response
      mockApiRequest({
        url: '/auth/login',
        method: 'POST',
        status: 401,
        data: { message: 'Invalid credentials' }
      });

      render(<Login />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: validCredentials.email }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/login failed/i);
      });
    });

    test('handles network error during login', async () => {
      // Mock network error
      mockApiRequest({
        url: '/auth/login',
        method: 'POST',
        status: 500
      });

      render(<Login />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: validCredentials.email }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: validCredentials.password }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/login failed/i);
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to forgot password page', () => {
      render(<Login />);
      
      fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
      
      expect(window.location.href).toContain('/forgot-password');
    });
  });
});