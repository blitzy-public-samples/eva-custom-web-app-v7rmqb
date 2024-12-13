import React from 'react'; // v18.2+
import { render, screen, fireEvent, within } from '@testing-library/react'; // v14.0.0
import userEvent from '@testing-library/user-event'; // v14.0.0
import { axe, toHaveNoViolations } from 'jest-axe'; // v4.7.0
import Input from './Input';
import { renderWithProviders } from '../../../utils/test.util';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test constants
const TEST_ID = {
  INPUT: 'input-field',
  ERROR: 'error-message',
  LABEL: 'input-label',
  HELPER: 'helper-text',
  CONTAINER: 'input-container'
} as const;

// Mock props
const MOCK_PROPS = {
  id: 'test-input',
  label: 'Test Input',
  value: '',
  onChange: jest.fn(),
  error: '',
  type: 'text',
  required: false,
  disabled: false,
  placeholder: 'Enter value',
  autoComplete: 'off'
} as const;

describe('Input Component', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accessibility Requirements', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <Input {...MOCK_PROPS} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels when required', () => {
      renderWithProviders(
        <Input {...MOCK_PROPS} required={true} />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should announce error messages to screen readers', () => {
      const errorMessage = 'This field is required';
      renderWithProviders(
        <Input {...MOCK_PROPS} error={errorMessage} />
      );
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input {...MOCK_PROPS} />);
      
      const input = screen.getByRole('textbox');
      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Senior-Friendly Interaction Patterns', () => {
    it('should have sufficient touch target size', () => {
      renderWithProviders(<Input {...MOCK_PROPS} />);
      const input = screen.getByRole('textbox');
      const inputRect = input.getBoundingClientRect();
      expect(inputRect.height).toBeGreaterThanOrEqual(48); // Minimum touch target size
    });

    it('should have clear visual focus indicators', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input {...MOCK_PROPS} />);
      
      const input = screen.getByRole('textbox');
      await user.tab();
      expect(input).toHaveAttribute('data-focused', 'true');
    });

    it('should display error states with high contrast', () => {
      const errorMessage = 'Invalid input';
      renderWithProviders(
        <Input {...MOCK_PROPS} error={errorMessage} />
      );
      
      const errorElement = screen.getByRole('alert');
      const styles = window.getComputedStyle(errorElement);
      expect(styles.color).toBe('var(--color-error)');
    });

    it('should maintain readable text size', () => {
      renderWithProviders(<Input {...MOCK_PROPS} />);
      const input = screen.getByRole('textbox');
      const styles = window.getComputedStyle(input);
      expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(16);
    });
  });

  describe('Validation and Error States', () => {
    it('should display required field indicator', () => {
      renderWithProviders(
        <Input {...MOCK_PROPS} required={true} />
      );
      const label = screen.getByText(/Test Input/);
      expect(label).toHaveTextContent(/\*/);
    });

    it('should handle input changes correctly', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      renderWithProviders(
        <Input {...MOCK_PROPS} onChange={onChange} />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test value');
      
      expect(onChange).toHaveBeenCalledTimes(10);
      expect(input).toHaveValue('test value');
    });

    it('should display error messages prominently', () => {
      const errorMessage = 'Required field';
      renderWithProviders(
        <Input {...MOCK_PROPS} error={errorMessage} />
      );
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeVisible();
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    it('should handle disabled state correctly', () => {
      renderWithProviders(
        <Input {...MOCK_PROPS} disabled={true} />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveStyle({ backgroundColor: 'var(--color-background-paper)' });
    });
  });

  describe('Material UI Integration', () => {
    it('should apply Material UI theme styles', () => {
      renderWithProviders(<Input {...MOCK_PROPS} />);
      const input = screen.getByRole('textbox');
      expect(input.closest('.MuiInputBase-root')).toBeInTheDocument();
    });

    it('should handle different input variants', () => {
      renderWithProviders(<Input {...MOCK_PROPS} />);
      const input = screen.getByRole('textbox');
      expect(input.closest('.MuiOutlinedInput-root')).toBeInTheDocument();
    });

    it('should apply proper focus styles', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input {...MOCK_PROPS} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      const inputContainer = input.closest('.MuiInputBase-root');
      expect(inputContainer).toHaveClass('Mui-focused');
    });

    it('should handle helper text display', () => {
      const helperText = 'Helper text';
      renderWithProviders(
        <Input {...MOCK_PROPS} helperText={helperText} />
      );
      
      const helperElement = screen.getByText(helperText);
      expect(helperElement).toHaveClass('MuiFormHelperText-root');
    });
  });
});