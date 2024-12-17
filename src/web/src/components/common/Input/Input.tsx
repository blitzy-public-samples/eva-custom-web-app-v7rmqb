import React from 'react'; // v18.2+
import { TextField } from '@mui/material'; // v5.11+
import { styled } from '@mui/material/styles'; // v5.11+
import '../../../styles/variables.css';

// Constants for ARIA labels and accessibility
const ARIA_LABELS = {
  INPUT: 'input-field',
  REQUIRED: 'required field',
  ERROR: 'error message'
} as const;

// Interface for component props with comprehensive typing
export interface InputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'date';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

// Styled TextField component using design system tokens
const StyledTextField = styled(TextField)(() => ({
  '& .MuiInputBase-root': {
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family-base)',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--color-background)',
    
    // Increased touch target size for senior users
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    minHeight: '48px',
    
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--color-primary)',
        borderWidth: '2px'
      }
    },
    
    '&.Mui-error': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--color-error)'
      }
    },
    
    '&.Mui-disabled': {
      backgroundColor: 'var(--color-background-paper)',
      cursor: 'not-allowed'
    }
  },
  
  '& .MuiInputLabel-root': {
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family-base)',
    color: 'var(--color-text-secondary)',
    
    '&.Mui-focused': {
      color: 'var(--color-primary)'
    },
    
    '&.Mui-error': {
      color: 'var(--color-error)'
    }
  },
  
  '& .MuiFormHelperText-root': {
    fontSize: 'calc(var(--font-size-base) * 0.875)',
    marginTop: 'var(--spacing-xs)',
    
    '&.Mui-error': {
      color: 'var(--color-error)'
    }
  }
}));

/**
 * Input component implementing Estate Kit design system specifications
 * with built-in validation support and senior-friendly interaction patterns.
 *
 * @param {InputProps} props - Component props
 * @returns {JSX.Element} Rendered input component
 */
const Input: React.FC<InputProps> = React.memo(({
  id,
  name,
  label,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  autoComplete
}) => {
  // Generate unique IDs for accessibility
  const inputId = `input-${id}`;
  const errorId = `error-${id}`;
  
  // Compute ARIA attributes
  const ariaProps = {
    'aria-label': `${label} ${ARIA_LABELS.INPUT}`,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined
  };

  return (
    <StyledTextField
      id={inputId}
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={error}
      type={type}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
      fullWidth
      variant="outlined"
      FormHelperTextProps={{
        id: errorId,
        role: 'alert',
        'aria-label': error ? ARIA_LABELS.ERROR : undefined
      }}
      InputProps={{
        ...ariaProps
      }}
      // Enhanced focus handling for accessibility
      onFocus={(event) => {
        event.target.setAttribute('data-focused', 'true');
      }}
      onBlur={(event) => {
        event.target.removeAttribute('data-focused');
      }}
    />
  );
});

// Display name for debugging
Input.displayName = 'Input';

export default Input;