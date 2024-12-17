import React, { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import { Select as MuiSelect, FormControl, InputLabel, FormHelperText } from '@mui/material';
import '../../styles/variables.css';

// Interfaces
interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  groupLabel?: string;
}

interface SelectProps {
  name: string;
  label: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  helpText?: string;
  ariaLabel?: string;
  placeholder?: string;
}

// Styled Components
const StyledFormControl = styled(FormControl)(({ fullWidth }) => ({
  marginBottom: 'var(--spacing-md)',
  width: fullWidth ? '100%' : 'auto',
  minHeight: '80px', // Ensures consistent spacing even with error messages
}));

const StyledSelect = styled(MuiSelect)(() => ({
  fontFamily: 'var(--font-family-base)',
  fontSize: 'var(--font-size-large)',
  padding: '12px',
  minHeight: '48px', // Enhanced touch target size
  lineHeight: '1.5',
  '& .MuiSelect-select': {
    padding: '12px 16px',
    minHeight: '48px',
  },
  '&:focus': {
    outline: `3px solid var(--color-primary)`,
    outlineOffset: '2px',
  },
  '&.Mui-error': {
    borderColor: 'var(--color-error)',
  },
  '& .MuiSelect-icon': {
    width: '24px',
    height: '24px',
    right: '12px',
  },
}));

const StyledLabel = styled(InputLabel)(() => ({
  fontFamily: 'var(--font-family-base)',
  fontSize: 'var(--font-size-large)',
  color: 'var(--color-text)',
  fontWeight: 500,
  marginBottom: '8px',
  transform: 'none',
  position: 'relative',
  '&.Mui-focused': {
    color: 'var(--color-primary)',
  },
  '&.Mui-error': {
    color: 'var(--color-error)',
  },
}));

const StyledHelperText = styled(FormHelperText)(({ error }) => ({
  fontSize: 'var(--font-size-base)',
  color: error ? 'var(--color-error)' : 'var(--color-text-secondary)',
  marginTop: '4px',
  minHeight: '20px',
}));

// Select Component
const Select: React.FC<SelectProps> = ({
  name,
  label,
  value,
  options,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  fullWidth = true,
  helpText,
  ariaLabel,
  placeholder,
}) => {
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        break;
      case 'Escape':
        (event.target as HTMLElement).blur();
        break;
    }
  }, []);

  // Handle change with proper announcements
  const handleChange = useCallback((event: any) => {
    const newValue = event.target.value;
    onChange(newValue);
    
    // Announce selection to screen readers
    const selectedOption = options.find(opt => opt.value === newValue);
    if (selectedOption) {
      const announcement = `Selected ${selectedOption.label}`;
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('aria-live', 'polite');
      ariaLive.textContent = announcement;
      document.body.appendChild(ariaLive);
      setTimeout(() => document.body.removeChild(ariaLive), 1000);
    }
  }, [onChange, options]);

  const selectId = `select-${name}`;
  const helpTextId = `${selectId}-helper-text`;
  const labelId = `${selectId}-label`;

  return (
    <StyledFormControl
      fullWidth={fullWidth}
      error={!!error}
      disabled={disabled}
      variant="outlined"
    >
      <StyledLabel
        id={labelId}
        required={required}
        error={!!error}
      >
        {label}
      </StyledLabel>
      
      <StyledSelect
        id={selectId}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || label}
        aria-describedby={helpTextId}
        aria-invalid={!!error}
        aria-required={required}
        labelId={labelId}
        error={!!error}
        disabled={disabled}
        placeholder={placeholder}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: '300px',
              fontSize: 'var(--font-size-large)',
              padding: '8px 0',
            },
          },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            aria-label={option.description || option.label}
            data-group={option.groupLabel}
          >
            {option.label}
          </option>
        ))}
      </StyledSelect>

      <StyledHelperText
        id={helpTextId}
        error={!!error}
      >
        {error || helpText}
      </StyledHelperText>
    </StyledFormControl>
  );
};

export default Select;