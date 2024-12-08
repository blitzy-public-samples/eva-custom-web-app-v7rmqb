/**
 * Estate Kit - Form Component Tests
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and reliability of the Form component.
 */

// React v18.2.0
import React from 'react';
// @testing-library/react v13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// jest v29.0.0
import '@testing-library/jest-dom';

// Internal imports
import Form from './Form';
import { mockApiRequest, validateTestData } from '../../utils/test.util';

// Mock form field data
const mockFields = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    placeholder: 'Enter your email',
    autoComplete: 'email',
    value: ''
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    placeholder: 'Enter your password',
    autoComplete: 'current-password',
    value: ''
  }
];

// Mock form submission handler
const mockOnSubmit = jest.fn();

describe('Form Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders the form with correct title and fields', () => {
      render(
        <Form
          title="Test Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Verify form title
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Form');

      // Verify form fields
      mockFields.forEach(field => {
        expect(screen.getByLabelText(field.label)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(field.placeholder!)).toBeInTheDocument();
      });

      // Verify submit button
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('applies correct ARIA attributes for accessibility', () => {
      render(
        <Form
          title="Accessible Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Verify form ARIA label
      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Accessible Form');

      // Verify required field indicators
      mockFields.forEach(field => {
        if (field.required) {
          const input = screen.getByLabelText(field.label);
          expect(input).toHaveAttribute('aria-required', 'true');
        }
      });
    });
  });

  describe('Form Validation', () => {
    it('displays validation errors for required fields', async () => {
      render(
        <Form
          title="Validation Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Submit form without filling required fields
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify error messages
      await waitFor(() => {
        mockFields.forEach(field => {
          if (field.required) {
            expect(screen.getByText('This field is required')).toBeInTheDocument();
          }
        });
      });

      // Verify onSubmit was not called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates email format correctly', async () => {
      render(
        <Form
          title="Email Validation Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Enter invalid email
      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      // Verify email validation error
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Enter valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.blur(emailInput);

      // Verify error is cleared
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('handles successful form submission', async () => {
      // Mock API request for successful submission
      const mockResponse = { success: true };
      mockApiRequest({
        url: '/api/submit',
        method: 'POST',
        data: mockResponse,
        status: 200
      });

      render(
        <Form
          title="Submit Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill out form fields
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'password123' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      // Verify button state during submission
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      // Verify button state after submission
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });
    });

    it('handles form submission errors', async () => {
      // Mock API request for failed submission
      const mockError = { message: 'Submission failed' };
      mockApiRequest({
        url: '/api/submit',
        method: 'POST',
        data: mockError,
        status: 400
      });

      render(
        <Form
          title="Error Form"
          fields={mockFields}
          onSubmit={() => Promise.reject(new Error('Submission failed'))}
        />
      );

      // Fill out form fields
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'password123' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText('An error occurred while submitting the form')).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    it('maintains field values between renders', () => {
      const { rerender } = render(
        <Form
          title="State Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Set field values
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'password123' }
      });

      // Rerender component
      rerender(
        <Form
          title="State Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Verify field values are maintained
      expect(screen.getByLabelText('Email Address')).toHaveValue('test@example.com');
      expect(screen.getByLabelText('Password')).toHaveValue('password123');
    });

    it('clears errors when fields are modified', async () => {
      render(
        <Form
          title="Error Clear Form"
          fields={mockFields}
          onSubmit={mockOnSubmit}
        />
      );

      // Submit empty form to trigger errors
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify errors are displayed
      await waitFor(() => {
        expect(screen.getAllByText('This field is required')).toHaveLength(2);
      });

      // Modify fields
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: 'test@example.com' }
      });

      // Verify error is cleared for modified field
      await waitFor(() => {
        expect(screen.getAllByText('This field is required')).toHaveLength(1);
      });
    });
  });
});