// @jest/react version ^29.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Select } from './Select';
import { mockApiRequest, validateTestData, formatTestOutput } from '../../../utils/test.util';
import { theme } from '../../../config/theme.config';

/**
 * Test suite for the Select component
 * Addresses Testing Framework requirement from Technical Specifications/4.5 Development & Deployment/Testing
 */

// Mock options for testing
const mockOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' }
];

// Test schema for validating component props
const selectPropsSchema = {
  type: 'object',
  properties: {
    value: { type: 'string' },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' }
        }
      }
    },
    label: { type: 'string' },
    helperText: { type: 'string' },
    error: { type: 'boolean' },
    required: { type: 'boolean' },
    disabled: { type: 'boolean' }
  },
  required: ['options']
};

// Wrapper component for providing theme context
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Select Component', () => {
  // Test rendering
  describe('testSelectRendering', () => {
    it('renders correctly with default props', () => {
      const props = {
        value: '',
        options: mockOptions,
        label: 'Test Select'
      };

      // Validate test data
      expect(validateTestData(props, selectPropsSchema)).toBe(true);

      const { container } = renderWithTheme(
        <Select {...props} />
      );

      // Verify component renders
      expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
      expect(container.querySelector('.MuiSelect-root')).toBeInTheDocument();

      // Verify snapshot
      expect(container).toMatchSnapshot();
    });

    it('renders with required prop', () => {
      renderWithTheme(
        <Select
          value=""
          options={mockOptions}
          label="Required Select"
          required
        />
      );

      // Verify required indicator is present
      const label = screen.getByText('Required Select');
      expect(label).toHaveClass('Mui-required');
    });

    it('renders with error state', () => {
      renderWithTheme(
        <Select
          value=""
          options={mockOptions}
          label="Error Select"
          error
          helperText="Error message"
        />
      );

      // Verify error styling
      expect(screen.getByText('Error message')).toHaveClass('Mui-error');
    });

    it('renders in disabled state', () => {
      renderWithTheme(
        <Select
          value=""
          options={mockOptions}
          label="Disabled Select"
          disabled
        />
      );

      // Verify disabled state
      expect(screen.getByLabelText('Disabled Select')).toBeDisabled();
    });
  });

  // Test interactions
  describe('testSelectInteraction', () => {
    it('handles option selection correctly', async () => {
      const handleChange = jest.fn();

      renderWithTheme(
        <Select
          value=""
          options={mockOptions}
          label="Interactive Select"
          onChange={handleChange}
        />
      );

      // Open dropdown
      fireEvent.mouseDown(screen.getByLabelText('Interactive Select'));

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeVisible();
      });

      // Select an option
      fireEvent.click(screen.getByText('Option 1'));

      // Verify onChange handler was called
      expect(handleChange).toHaveBeenCalled();
      expect(formatTestOutput(handleChange.mock.calls[0][1])).toBe('1');
    });

    it('handles empty selection when not required', async () => {
      const handleChange = jest.fn();

      renderWithTheme(
        <Select
          value="1"
          options={mockOptions}
          label="Optional Select"
          onChange={handleChange}
        />
      );

      // Open dropdown
      fireEvent.mouseDown(screen.getByLabelText('Optional Select'));

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByText('None')).toBeVisible();
      });

      // Select empty option
      fireEvent.click(screen.getByText('None'));

      // Verify onChange handler was called with empty value
      expect(handleChange).toHaveBeenCalled();
      expect(formatTestOutput(handleChange.mock.calls[0][1])).toBe('');
    });
  });

  // Test styling
  describe('testSelectStyling', () => {
    it('applies correct theme styles', () => {
      const { container } = renderWithTheme(
        <Select
          value=""
          options={mockOptions}
          label="Styled Select"
        />
      );

      const selectElement = container.querySelector('.MuiOutlinedInput-root');

      // Verify theme colors are applied
      expect(selectElement).toHaveStyle({
        '& fieldset': {
          borderColor: theme.palette.primary.main
        }
      });
    });

    it('applies error styles correctly', () => {
      const { container } = renderWithTheme(
        <Select
          value=""
          options={mockOptions}
          label="Error Select"
          error
        />
      );

      const selectElement = container.querySelector('.MuiOutlinedInput-root');

      // Verify error styles are applied
      expect(selectElement).toHaveStyle({
        '& fieldset': {
          borderColor: theme.palette.error.main
        }
      });
    });
  });
});