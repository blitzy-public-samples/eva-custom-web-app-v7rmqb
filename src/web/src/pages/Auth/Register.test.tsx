// @testing-library/react version ^13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// @testing-library/jest-dom version ^5.16.5
import '@testing-library/jest-dom';
// react version ^18.2.0
import React from 'react';
// jest version ^29.0.0
import { jest } from '@jest/globals';

// Internal imports
import RegisterPage from './Register';
import PublicRoute from '../../routes/PublicRoute';
import { validateAuth } from '../../utils/validation.util';
import { makeRequest } from '../../config/api.config';

// Mock dependencies
jest.mock('../../routes/PublicRoute', () => {
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});

jest.mock('../../utils/validation.util', () => ({
  validateAuth: jest.fn(),
}));

jest.mock('../../config/api.config', () => ({
  makeRequest: jest.fn(),
}));

jest.mock('../../config/auth.config', () => ({
  initializeAuth0: () => ({
    signup: jest.fn(),
  }),
}));

describe('RegisterPage Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Component Rendering
   * Requirements addressed:
   * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
   */
  describe('Component Rendering', () => {
    it('should render the registration form with all required elements', () => {
      render(<RegisterPage />);

      // Verify form title and description
      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByText(/Join Estate Kit to start organizing/)).toBeInTheDocument();

      // Verify form fields
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();

      // Verify links and notices
      expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Form Validation
   * Requirements addressed:
   * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
   */
  describe('Form Validation', () => {
    it('should validate email format', async () => {
      (validateAuth as jest.Mock).mockReturnValue(false);
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password format/i)).toBeInTheDocument();
      });
    });

    it('should validate password match', async () => {
      render(<RegisterPage />);

      // Enter different passwords
      fireEvent.change(screen.getByLabelText(/Password/i), { 
        target: { value: 'Password123!' } 
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { 
        target: { value: 'DifferentPassword123!' } 
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      render(<RegisterPage />);

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/This field is required/i)).toHaveLength(3);
      });
    });
  });

  /**
   * Test: API Integration
   * Requirements addressed:
   * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
   */
  describe('API Integration', () => {
    it('should handle successful registration', async () => {
      (validateAuth as jest.Mock).mockReturnValue(true);
      const mockSignup = jest.fn().mockResolvedValue({});

      jest.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        href: '',
      });

      render(<RegisterPage />);

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'ValidPassword123!' }
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
        target: { value: 'ValidPassword123!' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(validateAuth).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'ValidPassword123!'
        });
      });
    });

    it('should handle registration error', async () => {
      (validateAuth as jest.Mock).mockReturnValue(true);
      const mockError = new Error('Registration failed');
      const mockSignup = jest.fn().mockRejectedValue(mockError);

      render(<RegisterPage />);

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'ValidPassword123!' }
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
        target: { value: 'ValidPassword123!' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
      });
    });
  });
});