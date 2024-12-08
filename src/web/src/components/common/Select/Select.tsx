// Human Tasks:
// 1. Verify accessibility compliance with WCAG 2.1 Level AA standards
// 2. Test keyboard navigation behavior across different browsers
// 3. Validate color contrast ratios for all select states (hover, focus, disabled)
// 4. Review dropdown positioning behavior on different viewport sizes

// @mui/material version 5.11.0
import { 
  Select as MuiSelect,
  SelectProps as MuiSelectProps,
  FormControl,
  InputLabel,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { palette } from '../../config/theme.config';
import { validateAuth } from '../../utils/validation.util';
import { formatDocumentTitle } from '../../utils/format.util';

/**
 * Interface defining the props for the Select component
 * Extends Material UI's SelectProps with custom properties
 */
interface SelectProps extends Omit<MuiSelectProps, 'value'> {
  /** The currently selected value */
  value: string | number | undefined;
  /** Array of options to display in the select dropdown */
  options: Array<{
    value: string | number;
    label: string;
  }>;
  /** Label text to display above the select */
  label?: string;
  /** Helper text to display below the select */
  helperText?: string;
  /** Error state of the select */
  error?: boolean;
  /** Whether the select is required */
  required?: boolean;
  /** Whether the select is disabled */
  disabled?: boolean;
}

/**
 * A reusable Select component that provides a styled dropdown menu with customizable options.
 * Addresses Frontend Design Consistency requirement from Technical Specifications/3.1 User Interface Design/Design System Specifications
 */
export const Select = ({
  value,
  options,
  label,
  helperText,
  error = false,
  required = false,
  disabled = false,
  onChange,
  ...props
}: SelectProps): JSX.Element => {
  // Generate a unique ID for accessibility
  const labelId = `select-label-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <FormControl 
      fullWidth 
      error={error}
      required={required}
      disabled={disabled}
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: error ? palette.error.main : palette.primary.main,
          },
          '&:hover fieldset': {
            borderColor: error ? palette.error.main : palette.primary.light,
          },
          '&.Mui-focused fieldset': {
            borderColor: error ? palette.error.main : palette.primary.dark,
          },
        },
        '& .MuiSelect-icon': {
          color: error ? palette.error.main : palette.primary.main,
        },
      }}
    >
      {label && (
        <InputLabel 
          id={labelId}
          error={error}
          required={required}
          sx={{
            color: error ? palette.error.main : palette.text.primary,
          }}
        >
          {label}
        </InputLabel>
      )}
      
      <MuiSelect
        labelId={labelId}
        value={value ?? ''}
        label={label}
        onChange={onChange}
        error={error}
        {...props}
        sx={{
          '& .MuiSelect-select': {
            minHeight: '1.4375em',
            padding: '16.5px 14px',
          },
          ...props.sx,
        }}
      >
        {/* Add an empty option if the select is not required */}
        {!required && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        
        {/* Map through options to create menu items */}
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            sx={{
              '&.Mui-selected': {
                backgroundColor: `${palette.primary.light}20`,
              },
              '&.Mui-selected:hover': {
                backgroundColor: `${palette.primary.light}30`,
              },
            }}
          >
            {formatDocumentTitle(option.label)}
          </MenuItem>
        ))}
      </MuiSelect>

      {helperText && (
        <FormHelperText 
          error={error}
          sx={{
            margin: '8px 0 0',
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};