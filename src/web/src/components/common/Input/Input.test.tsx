// @testing-library/react v13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// jest v29.0.0
import '@testing-library/jest-dom';
// react v18.2.0
import React from 'react';

// Internal imports
import Input from './Input';
import { mockApiRequest, validateTestData } from '../../utils/test.util';

/**
 * Input Component Unit Tests
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and reliability of the Input component.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures the Input component adheres to the design system and behaves consistently.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Tests the Input component for compliance with WCAG 2.1 Level AA accessibility standards.
 */

describe('Input Component', () => {
  // Common props for testing
  const defaultProps = {
    type: 'text',
    name: 'testInput',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders input element with default props', () => {
      render(<Input {...defaultProps} />);
      const inputElement = screen.getByRole('textbox');
      
      expect(inputElement).toBeInTheDocument();
      expect(inputElement).toHaveAttribute('type', 'text');
      expect(inputElement).toHaveAttribute('name', 'testInput');
    });

    test('renders label when provided', () => {
      const label = 'Test Label';
      render(<Input {...defaultProps} label={label} />);
      
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    test('renders required indicator when input is required', () => {
      render(<Input {...defaultProps} label="Test Label" required />);
      const label = screen.getByText('*');
      
      expect(label).toBeInTheDocument();
      expect(label).toHaveStyle({ color: expect.any(String) });
    });
  });

  describe('Validation', () => {
    test('displays error message when provided', () => {
      const errorMessage = 'This field is required';
      render(<Input {...defaultProps} errorMessage={errorMessage} />);
      const errorElement = screen.getByRole('alert');
      
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    test('validates required field on blur', async () => {
      render(<Input {...defaultProps} required validateOnBlur />);
      const inputElement = screen.getByRole('textbox');
      
      fireEvent.blur(inputElement);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
      });
    });

    test('validates email format on blur', async () => {
      render(<Input {...defaultProps} type="email" validateOnBlur />);
      const inputElement = screen.getByRole('textbox');
      
      fireEvent.change(inputElement, { target: { value: 'invalid-email' } });
      fireEvent.blur(inputElement);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
      });
    });

    test('clears error message when user starts typing', () => {
      render(<Input {...defaultProps} errorMessage="Initial error" />);
      const inputElement = screen.getByRole('textbox');
      
      fireEvent.change(inputElement, { target: { value: 'new value' } });
      
      expect(screen.getByRole('alert')).toHaveTextContent('');
    });
  });

  describe('Accessibility', () => {
    test('has appropriate ARIA attributes', () => {
      render(<Input {...defaultProps} label="Test Label" errorMessage="Test Error" />);
      const inputElement = screen.getByRole('textbox');
      
      expect(inputElement).toHaveAttribute('aria-invalid', 'true');
      expect(inputElement).toHaveAttribute('aria-describedby', `${defaultProps.name}-error`);
    });

    test('associates label with input using htmlFor', () => {
      render(<Input {...defaultProps} label="Test Label" />);
      const inputElement = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');
      
      expect(label).toHaveAttribute('for', defaultProps.name);
      expect(inputElement).toHaveAttribute('id', defaultProps.name);
    });

    test('supports keyboard navigation', () => {
      render(<Input {...defaultProps} />);
      const inputElement = screen.getByRole('textbox');
      
      inputElement.focus();
      expect(document.activeElement).toBe(inputElement);
    });
  });

  describe('Event Handling', () => {
    test('calls onChange handler when value changes', () => {
      render(<Input {...defaultProps} />);
      const inputElement = screen.getByRole('textbox');
      const newValue = 'test value';
      
      fireEvent.change(inputElement, { target: { value: newValue } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(newValue);
    });

    test('handles focus and blur events', () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      
      render(<Input {...defaultProps} onFocus={onFocus} onBlur={onBlur} />);
      const inputElement = screen.getByRole('textbox');
      
      fireEvent.focus(inputElement);
      expect(onFocus).toHaveBeenCalled();
      
      fireEvent.blur(inputElement);
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Style and Theme', () => {
    test('applies error styles when error is present', () => {
      render(<Input {...defaultProps} errorMessage="Test Error" />);
      const inputElement = screen.getByRole('textbox');
      
      expect(inputElement).toHaveStyle({
        border: expect.stringContaining('error'),
      });
    });

    test('applies focus styles when input is focused', () => {
      render(<Input {...defaultProps} />);
      const inputElement = screen.getByRole('textbox');
      
      fireEvent.focus(inputElement);
      
      expect(inputElement).toHaveStyle({
        borderColor: expect.any(String),
      });
    });
  });
});