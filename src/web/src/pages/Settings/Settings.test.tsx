import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import Settings from './Settings';
import { renderWithProviders } from '../../utils/test.util';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');

// Mock the analytics hook
jest.mock('@segment/analytics-next', () => ({
  useAnalytics: () => ({
    track: jest.fn()
  })
}));

// Test constants
const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  profile: {
    phoneNumber: '(555) 123-4567',
    province: 'Ontario',
    mfaEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    timezone: 'America/Toronto',
    language: 'en'
  }
};

const MOCK_SECURITY_SETTINGS = {
  twoFactorEnabled: false,
  emailNotifications: true,
  smsNotifications: false,
  lastUpdated: new Date(),
  updatedBy: 'test@example.com'
};

describe('Settings Page', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useAuth hook implementation
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: MOCK_USER,
      updateUser: jest.fn().mockResolvedValue(MOCK_USER)
    }));
  });

  it('renders all settings sections correctly', () => {
    renderWithProviders(<Settings />);

    // Verify profile settings section
    expect(screen.getByTestId('profile-settings-card')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Verify security settings section
    expect(screen.getByTestId('security-settings-card')).toBeInTheDocument();
    expect(screen.getByText('Security Settings')).toBeInTheDocument();

    // Verify form fields
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/province/i)).toBeInTheDocument();
  });

  it('meets accessibility standards', async () => {
    const { container } = renderWithProviders(<Settings />);

    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Test keyboard navigation
    const firstInput = screen.getByLabelText(/name/i);
    firstInput.focus();
    expect(document.activeElement).toBe(firstInput);

    // Tab through form elements
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/email/i));
  });

  it('handles profile form submission correctly', async () => {
    const mockUpdateUser = jest.fn().mockResolvedValue(MOCK_USER);
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: MOCK_USER,
      updateUser: mockUpdateUser
    }));

    renderWithProviders(<Settings />);

    // Fill form fields
    await userEvent.type(screen.getByLabelText(/name/i), 'Updated Name');
    await userEvent.type(screen.getByLabelText(/phone/i), '(555) 999-8888');
    await userEvent.selectOptions(screen.getByLabelText(/province/i), 'Ontario');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    await userEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        name: 'Updated Name',
        profile: {
          phoneNumber: '(555) 999-8888',
          province: 'Ontario'
        }
      });
    });
  });

  it('manages security settings correctly', async () => {
    const mockUpdateUser = jest.fn().mockResolvedValue({
      ...MOCK_USER,
      profile: {
        ...MOCK_USER.profile,
        mfaEnabled: true
      }
    });

    (useAuth as jest.Mock).mockImplementation(() => ({
      user: MOCK_USER,
      updateUser: mockUpdateUser
    }));

    renderWithProviders(<Settings />);

    // Toggle 2FA
    const twoFactorToggle = screen.getByTestId('two-factor-toggle');
    await userEvent.click(twoFactorToggle);

    // Verify API call
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        profile: {
          twoFactorEnabled: true
        }
      });
    });

    // Toggle email notifications
    const emailToggle = screen.getByTestId('email-notifications-toggle');
    await userEvent.click(emailToggle);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        profile: {
          emailNotifications: false
        }
      });
    });
  });

  it('handles errors gracefully', async () => {
    const mockError = new Error('Update failed');
    const mockUpdateUser = jest.fn().mockRejectedValue(mockError);
    
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: MOCK_USER,
      updateUser: mockUpdateUser
    }));

    renderWithProviders(<Settings />);

    // Attempt to submit form
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    await userEvent.click(submitButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByTestId('settings-error')).toBeInTheDocument();
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });
  });

  it('validates form inputs correctly', async () => {
    renderWithProviders(<Settings />);

    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    await userEvent.click(submitButton);

    // Verify validation messages
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/province is required/i)).toBeInTheDocument();
    });

    // Enter invalid phone number
    await userEvent.type(screen.getByLabelText(/phone/i), 'invalid');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
    });
  });

  it('tracks analytics events correctly', async () => {
    const mockTrack = jest.fn();
    jest.mock('@segment/analytics-next', () => ({
      useAnalytics: () => ({
        track: mockTrack
      })
    }));

    renderWithProviders(<Settings />);

    // Update profile
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    await userEvent.click(submitButton);

    // Verify analytics event
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('profile_updated', expect.any(Object));
    });

    // Toggle security setting
    const twoFactorToggle = screen.getByTestId('two-factor-toggle');
    await userEvent.click(twoFactorToggle);

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('security_setting_changed', expect.any(Object));
    });
  });
});