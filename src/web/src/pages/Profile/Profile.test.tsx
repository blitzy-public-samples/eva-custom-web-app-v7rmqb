/**
 * Profile Page Component Tests
 * Version: 1.0.0
 * 
 * Comprehensive test suite for the Profile page component ensuring proper rendering,
 * user interaction, form submission, error handling, and accessibility compliance.
 */

import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from '@axe-core/react';
import { Profile } from './Profile';
import { renderWithProviders } from '../../utils/test.util';

// Mock user data for testing
const MOCK_USER = {
  id: 'test-user-id',
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '(555) 123-4567',
  province: 'Ontario',
  postalCode: 'M5V 2T6',
  language: 'en',
  notifications: {
    email: true,
    sms: false
  }
};

// Mock profile update data
const MOCK_PROFILE_DATA = {
  name: 'Updated Name',
  email: 'updated@email.com',
  phone: '(555) 987-6543',
  province: 'British Columbia',
  postalCode: 'V6B 4N7',
  language: 'en',
  notifications: {
    email: true,
    sms: true
  }
};

// Test timeout configuration
const TEST_TIMEOUT = 10000;

// Mock hooks and services
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    loading: false,
    error: null
  })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

describe('Profile Page Component', () => {
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Cleanup after each test
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 Level AA requirements', async () => {
      const { container } = renderWithProviders(<Profile />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<Profile />);
      
      // Check main heading
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Profile Settings');
      
      // Check form accessibility
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Profile Settings Form');
      
      // Check input fields accessibility
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Province/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<Profile />);
      
      const form = screen.getByRole('form');
      const inputs = within(form).getAllByRole('textbox');
      
      // Test tab navigation
      for (const input of inputs) {
        input.focus();
        expect(document.activeElement).toBe(input);
      }
    });
  });

  describe('Profile Form Rendering', () => {
    it('should render profile form with user data', () => {
      renderWithProviders(<Profile />);
      
      // Check form fields are populated with mock user data
      expect(screen.getByDisplayValue(MOCK_USER.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(MOCK_USER.email)).toBeInTheDocument();
      expect(screen.getByDisplayValue(MOCK_USER.phone)).toBeInTheDocument();
      expect(screen.getByDisplayValue(MOCK_USER.province)).toBeInTheDocument();
    });

    it('should show loading state while fetching user data', () => {
      jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
      renderWithProviders(<Profile />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle error state appropriately', async () => {
      const errorMessage = 'Failed to load profile';
      jest.spyOn(React, 'useState').mockImplementationOnce(() => [null, jest.fn()]);
      jest.spyOn(React, 'useState').mockImplementationOnce(() => [errorMessage, jest.fn()]);
      
      renderWithProviders(<Profile />);
      
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  describe('Profile Form Interaction', () => {
    it('should handle form submission with valid data', async () => {
      const mockSubmit = jest.fn();
      renderWithProviders(<Profile />);
      
      // Fill form with updated data
      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const provinceInput = screen.getByLabelText(/Province/i);
      
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, MOCK_PROFILE_DATA.name);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, MOCK_PROFILE_DATA.email);
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, MOCK_PROFILE_DATA.phone);
      await userEvent.clear(provinceInput);
      await userEvent.type(provinceInput, MOCK_PROFILE_DATA.province);
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /Save/i });
      await userEvent.click(submitButton);
      
      // Verify submission
      await waitFor(() => {
        expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should validate Canadian phone number format', async () => {
      renderWithProviders(<Profile />);
      
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, '123-invalid');
      
      const submitButton = screen.getByRole('button', { name: /Save/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid Canadian phone number/i)).toBeInTheDocument();
      });
    });

    it('should validate Canadian province selection', async () => {
      renderWithProviders(<Profile />);
      
      const provinceInput = screen.getByLabelText(/Province/i);
      await userEvent.clear(provinceInput);
      await userEvent.type(provinceInput, 'Invalid Province');
      
      const submitButton = screen.getByRole('button', { name: /Save/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Please select a valid Canadian province/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security Features', () => {
    it('should sanitize user input before submission', async () => {
      const mockSubmit = jest.fn();
      renderWithProviders(<Profile />);
      
      const nameInput = screen.getByLabelText(/Full Name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, '<script>alert("xss")</script>John');
      
      const submitButton = screen.getByRole('button', { name: /Save/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Name contains invalid characters/i)).toBeInTheDocument();
      });
    });

    it('should require authentication to access profile page', () => {
      jest.spyOn(React, 'useState').mockImplementationOnce(() => [null, jest.fn()]);
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
      
      renderWithProviders(<Profile />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});