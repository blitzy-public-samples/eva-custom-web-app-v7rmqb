import React from 'react'; // v18.2+
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // v14.0.0
import userEvent from '@testing-library/user-event'; // v14.0.0
import { describe, it, expect, jest, beforeEach } from '@jest/globals'; // v29.0.0
import ProfileForm, { ProfileFormProps } from './ProfileForm';
import { renderWithProviders } from '../../../utils/test.util';

// Mock data for testing
const mockProfileData = {
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '(555) 123-4567',
  province: 'Ontario'
};

// Mock handlers
const mockHandlers = {
  onSubmit: jest.fn(),
  onError: jest.fn(),
  onSuccess: jest.fn()
};

// Test configuration
const testConfig = {
  timeouts: {
    submission: 3000,
    validation: 1000,
    animation: 500
  }
};

describe('ProfileForm Component', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={mockProfileData}
        />
      );

      // Check form role and label
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label');

      // Check input fields for proper labeling
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const provinceInput = screen.getByLabelText(/province/i);

      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(phoneInput).toHaveAttribute('aria-required', 'true');
      expect(provinceInput).toHaveAttribute('aria-required', 'true');
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={mockProfileData}
        />
      );

      const user = userEvent.setup();
      
      // Test tab order
      await user.tab();
      expect(screen.getByLabelText(/full name/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/phone number/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/province/i)).toHaveFocus();
    });

    it('should announce validation errors to screen readers', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={null}
        />
      );

      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /save profile/i });

      // Submit empty form
      await user.click(submitButton);

      // Check error messages are properly associated with inputs
      const nameError = await screen.findByText(/please enter your full name/i);
      expect(nameError).toHaveAttribute('role', 'alert');
      expect(nameError).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={null}
        />
      );

      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /save profile/i });

      // Submit empty form
      await user.click(submitButton);

      // Check for required field errors
      expect(await screen.findByText(/please enter your full name/i)).toBeInTheDocument();
      expect(await screen.findByText(/please enter your email address/i)).toBeInTheDocument();
      expect(await screen.findByText(/please enter your phone number/i)).toBeInTheDocument();
      expect(await screen.findByText(/please select your province/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={null}
        />
      );

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);

      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur validation

      expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();

      // Test valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@email.com');
      await user.tab();

      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });

    it('should validate phone number format', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={null}
        />
      );

      const user = userEvent.setup();
      const phoneInput = screen.getByLabelText(/phone number/i);

      // Test invalid phone number
      await user.type(phoneInput, '123456');
      await user.tab();

      expect(await screen.findByText(/please enter a valid canadian phone number/i)).toBeInTheDocument();

      // Test valid phone number
      await user.clear(phoneInput);
      await user.type(phoneInput, '(555) 123-4567');
      await user.tab();

      expect(screen.queryByText(/please enter a valid canadian phone number/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should handle successful form submission', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={null}
        />
      );

      const user = userEvent.setup();

      // Fill out form
      await user.type(screen.getByLabelText(/full name/i), mockProfileData.name);
      await user.type(screen.getByLabelText(/email address/i), mockProfileData.email);
      await user.type(screen.getByLabelText(/phone number/i), mockProfileData.phone);
      await user.type(screen.getByLabelText(/province/i), mockProfileData.province);

      // Submit form
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      // Verify submission
      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(expect.objectContaining(mockProfileData));
      });
    });

    it('should handle submission errors gracefully', async () => {
      const mockError = new Error('Submission failed');
      mockHandlers.onSubmit.mockRejectedValueOnce(mockError);

      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={mockProfileData}
        />
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      // Verify error handling
      expect(await screen.findByText(/profile update failed/i)).toBeInTheDocument();
    });

    it('should disable submit button during submission', async () => {
      renderWithProviders(
        <ProfileForm 
          onSubmit={mockHandlers.onSubmit}
          initialData={mockProfileData}
          loading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });
});