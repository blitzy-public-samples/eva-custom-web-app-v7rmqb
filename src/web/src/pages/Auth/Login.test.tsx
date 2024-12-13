import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import Login from './Login';
import { renderWithProviders } from '../../utils/test.util';
import type { LoginPayload } from '../../types/auth.types';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock Auth0 hook
const mockAuth0Login = jest.fn();
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: mockAuth0Login,
    isLoading: false,
    error: null
  })
}));

// Test constants
const VALID_CREDENTIALS: LoginPayload = {
  email: 'test@example.com',
  password: 'Password123!'
};

const ARIA_LABELS = {
  LOGIN_FORM: 'Estate Kit login form',
  EMAIL_INPUT: 'Email address input',
  PASSWORD_INPUT: 'Password input',
  SUBMIT_BUTTON: 'Sign in to Estate Kit',
  ERROR_MESSAGE: 'Login error message'
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockReset();
  });

  it('renders login form with all required elements', () => {
    renderWithProviders(<Login />);

    // Verify form elements
    expect(screen.getByRole('heading', { name: /sign in to estate kit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(ARIA_LABELS.EMAIL_INPUT)).toBeInTheDocument();
    expect(screen.getByLabelText(ARIA_LABELS.PASSWORD_INPUT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ARIA_LABELS.SUBMIT_BUTTON })).toBeInTheDocument();
  });

  it('validates email format correctly', async () => {
    renderWithProviders(<Login />);
    const emailInput = screen.getByLabelText(ARIA_LABELS.EMAIL_INPUT);

    // Test invalid email
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab(); // Trigger blur validation

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();

    // Test valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, VALID_CREDENTIALS.email);
    await userEvent.tab();

    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  it('validates password requirements', async () => {
    renderWithProviders(<Login />);
    const passwordInput = screen.getByLabelText(ARIA_LABELS.PASSWORD_INPUT);

    // Test short password
    await userEvent.type(passwordInput, 'short');
    await userEvent.tab();

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Test valid password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, VALID_CREDENTIALS.password);
    await userEvent.tab();

    expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
  });

  it('handles successful login flow', async () => {
    renderWithProviders(<Login />);

    // Fill form with valid credentials
    await userEvent.type(screen.getByLabelText(ARIA_LABELS.EMAIL_INPUT), VALID_CREDENTIALS.email);
    await userEvent.type(screen.getByLabelText(ARIA_LABELS.PASSWORD_INPUT), VALID_CREDENTIALS.password);

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: ARIA_LABELS.SUBMIT_BUTTON }));

    // Verify Auth0 login was called
    await waitFor(() => {
      expect(mockAuth0Login).toHaveBeenCalled();
    });

    // Verify navigation to dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login errors appropriately', async () => {
    // Mock Auth0 error
    mockAuth0Login.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    renderWithProviders(<Login />);

    // Fill and submit form
    await userEvent.type(screen.getByLabelText(ARIA_LABELS.EMAIL_INPUT), VALID_CREDENTIALS.email);
    await userEvent.type(screen.getByLabelText(ARIA_LABELS.PASSWORD_INPUT), VALID_CREDENTIALS.password);
    await userEvent.click(screen.getByRole('button', { name: ARIA_LABELS.SUBMIT_BUTTON }));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i);
    });
  });

  it('validates accessibility requirements', async () => {
    const { container } = renderWithProviders(<Login />);

    // Check ARIA labels and roles
    expect(screen.getByRole('form')).toHaveAttribute('aria-label', ARIA_LABELS.LOGIN_FORM);
    expect(screen.getByLabelText(ARIA_LABELS.EMAIL_INPUT)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(ARIA_LABELS.PASSWORD_INPUT)).toHaveAttribute('aria-required', 'true');

    // Verify keyboard navigation
    const emailInput = screen.getByLabelText(ARIA_LABELS.EMAIL_INPUT);
    const passwordInput = screen.getByLabelText(ARIA_LABELS.PASSWORD_INPUT);
    const submitButton = screen.getByRole('button', { name: ARIA_LABELS.SUBMIT_BUTTON });

    emailInput.focus();
    expect(document.activeElement).toBe(emailInput);

    await userEvent.tab();
    expect(document.activeElement).toBe(passwordInput);

    await userEvent.tab();
    expect(document.activeElement).toBe(submitButton);

    // Check color contrast (requires jest-axe for full implementation)
    expect(container).toMatchSnapshot();
  });

  it('displays loading state during authentication', async () => {
    // Mock delayed Auth0 login
    mockAuth0Login.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<Login />);

    // Submit form
    await userEvent.type(screen.getByLabelText(ARIA_LABELS.EMAIL_INPUT), VALID_CREDENTIALS.email);
    await userEvent.type(screen.getByLabelText(ARIA_LABELS.PASSWORD_INPUT), VALID_CREDENTIALS.password);
    await userEvent.click(screen.getByRole('button', { name: ARIA_LABELS.SUBMIT_BUTTON }));

    // Verify loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Verify button is disabled during loading
    expect(screen.getByRole('button', { name: ARIA_LABELS.SUBMIT_BUTTON })).toBeDisabled();
  });
});