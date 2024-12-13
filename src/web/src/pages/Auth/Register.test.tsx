import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Register from './Register';
import { renderWithProviders } from '../../utils/test.util';
import { RegisterPayload, Province } from '../../types/auth.types';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock Auth0 hooks
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    registerWithRedirect: jest.fn(),
    handleRedirectCallback: jest.fn(),
    isLoading: false,
    error: null
  })
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

// Mock Material UI hooks
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => true
}));

// Test data
const mockRegisterData: RegisterPayload = {
  email: 'test@example.com',
  password: 'Test123!@#',
  name: 'Test User',
  province: Province.ONTARIO,
  acceptedTerms: true,
  mfaPreference: true
};

describe('Register Component', () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    jest.clearAllMocks();
  });

  describe('Accessibility Requirements', () => {
    it('meets WCAG 2.1 Level AA requirements', async () => {
      const { container } = renderWithProviders(<Register />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper heading hierarchy', () => {
      renderWithProviders(<Register />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Create Your Estate Kit Account');
    });

    it('ensures all form fields have associated labels', () => {
      renderWithProviders(<Register />);
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<Register />);
      const form = screen.getByRole('form');
      const focusableElements = within(form).getAllByRole('textbox');
      
      // Verify tab order
      focusableElements.forEach((element, index) => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      renderWithProviders(<Register />);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/province is required/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      renderWithProviders(<Register />);
      const emailInput = screen.getByLabelText(/email address/i);
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      renderWithProviders(<Register />);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Test weak password
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.blur(passwordInput);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 12 characters/i)).toBeInTheDocument();
      });

      // Test strong password
      fireEvent.change(passwordInput, { target: { value: mockRegisterData.password } });
      fireEvent.blur(passwordInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/password must be/i)).not.toBeInTheDocument();
      });
    });

    it('validates province selection', async () => {
      renderWithProviders(<Register />);
      const provinceSelect = screen.getByLabelText(/province/i);
      
      fireEvent.change(provinceSelect, { target: { value: Province.ONTARIO } });
      
      await waitFor(() => {
        expect(provinceSelect).toHaveValue(Province.ONTARIO);
      });
    });
  });

  describe('Auth0 Integration', () => {
    it('handles successful registration', async () => {
      const { register } = renderWithProviders(<Register />).store.getState().auth;
      
      // Fill form
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: mockRegisterData.name } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: mockRegisterData.email } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: mockRegisterData.password } });
      fireEvent.change(screen.getByLabelText(/province/i), { target: { value: mockRegisterData.province } });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(register).toHaveBeenCalledWith(mockRegisterData);
        expect(mockNavigate).toHaveBeenCalledWith('/welcome', {
          state: { message: expect.any(String) }
        });
      });
    });

    it('handles registration errors', async () => {
      const mockError = new Error('Registration failed');
      const { register } = renderWithProviders(<Register />).store.getState().auth;
      register.mockRejectedValueOnce(mockError);
      
      // Submit form with valid data
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Senior-Friendly Features', () => {
    it('uses appropriate font sizes for readability', () => {
      renderWithProviders(<Register />);
      const heading = screen.getByRole('heading', { level: 1 });
      const computedStyle = window.getComputedStyle(heading);
      expect(computedStyle.fontSize).toBe('calc(var(--font-size-base) * 1.5)');
    });

    it('provides clear error messages', async () => {
      renderWithProviders(<Register />);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        errorMessages.forEach(message => {
          expect(message).toHaveStyle({ color: 'var(--color-error)' });
        });
      });
    });

    it('maintains consistent layout on different screen sizes', () => {
      const { rerender } = renderWithProviders(<Register />);
      
      // Test mobile layout
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
      rerender(<Register />);
      
      expect(screen.getByRole('form')).toHaveStyle({
        padding: 'var(--spacing-md)'
      });
      
      // Test desktop layout
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
      rerender(<Register />);
      
      expect(screen.getByRole('form')).toHaveStyle({
        padding: 'var(--spacing-xl)'
      });
    });
  });
});