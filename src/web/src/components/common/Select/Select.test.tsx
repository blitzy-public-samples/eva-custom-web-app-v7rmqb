import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Select from './Select';
import { renderWithProviders } from '../../../utils/test.util';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock options with domain-specific content
const mockOptions = [
  { value: '1', label: 'Medical Documents', description: 'Health records and directives' },
  { value: '2', label: 'Financial Records', description: 'Banking and investment information' },
  { value: '3', label: 'Legal Documents', description: 'Wills and power of attorney' }
];

// Mock change handler
const mockOnChange = jest.fn();
const mockOnBlur = jest.fn();

describe('Select Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnBlur.mockClear();
  });

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 Level AA standards', async () => {
      const { container } = renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          required
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA attributes', () => {
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          required
          error="Please select a document type"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-required', 'true');
      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).toHaveAttribute('aria-describedby');
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const select = screen.getByRole('combobox');
      
      // Test keyboard interaction
      select.focus();
      expect(select).toHaveFocus();

      // Open dropdown with space
      fireEvent.keyDown(select, { key: ' ' });
      await waitFor(() => {
        expect(screen.getByText('Medical Documents')).toBeVisible();
      });

      // Navigate with arrow keys
      fireEvent.keyDown(select, { key: 'ArrowDown' });
      expect(screen.getByText('Financial Records')).toHaveFocus();

      // Select with Enter
      fireEvent.keyDown(select, { key: 'Enter' });
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Senior-Friendly Features', () => {
    it('renders with large touch targets', () => {
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const select = screen.getByRole('combobox');
      const styles = window.getComputedStyle(select);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(48); // Minimum touch target size
    });

    it('provides clear visual feedback on interaction', async () => {
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const select = screen.getByRole('combobox');
      
      // Test focus state
      select.focus();
      expect(select).toHaveStyle({ outline: '3px solid var(--color-primary)' });

      // Test hover state
      userEvent.hover(select);
      expect(select).toHaveStyle({ cursor: 'pointer' });
    });

    it('displays clear error messages', () => {
      const errorMessage = 'Please select a document type';
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          error={errorMessage}
        />
      );

      const errorText = screen.getByText(errorMessage);
      expect(errorText).toHaveStyle({ color: 'var(--color-error)' });
      expect(errorText).toBeVisible();
    });

    it('announces selection changes to screen readers', async () => {
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const select = screen.getByRole('combobox');
      
      // Simulate selection
      userEvent.click(select);
      await waitFor(() => {
        const option = screen.getByText('Medical Documents');
        userEvent.click(option);
      });

      // Verify aria-live announcement
      const announcement = screen.getByText('Selected Medical Documents', { exact: false });
      expect(announcement).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('integrates with form validation', async () => {
      renderWithProviders(
        <form>
          <Select
            name="documentType"
            label="Document Type"
            value=""
            options={mockOptions}
            onChange={mockOnChange}
            onBlur={mockOnBlur}
            required
          />
          <button type="submit">Submit</button>
        </form>
      );

      // Try to submit without selection
      const submitButton = screen.getByText('Submit');
      userEvent.click(submitButton);

      // Verify validation message
      const validationMessage = await screen.findByText('Please select an option');
      expect(validationMessage).toBeVisible();
    });

    it('handles value changes correctly', async () => {
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      // Select an option
      const select = screen.getByRole('combobox');
      userEvent.click(select);
      
      await waitFor(() => {
        const option = screen.getByText('Medical Documents');
        userEvent.click(option);
      });

      expect(mockOnChange).toHaveBeenCalledWith('1');
    });

    it('maintains focus state appropriately', async () => {
      renderWithProviders(
        <Select
          name="documentType"
          label="Document Type"
          value=""
          options={mockOptions}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const select = screen.getByRole('combobox');
      
      // Test focus handling
      select.focus();
      expect(select).toHaveFocus();

      select.blur();
      expect(mockOnBlur).toHaveBeenCalled();
      expect(select).not.toHaveFocus();
    });
  });
});