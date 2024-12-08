/**
 * Estate Kit - Input Component
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements a reusable input component with consistent styling and theming
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Provides accessible input with ARIA attributes and keyboard navigation
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements input validation using the validateAuth utility
 * 
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards
 * 2. Test keyboard navigation and screen reader compatibility
 * 3. Validate error message display with screen readers
 */

// React v18.2.0
import React, { 
  ChangeEvent, 
  FocusEvent, 
  forwardRef, 
  InputHTMLAttributes, 
  useState 
} from 'react';

// prop-types v15.8.1
import PropTypes from 'prop-types';

// Internal imports
import { validateAuth } from '../../utils/validation.util';
import { theme } from '../../config/theme.config';

// Import required styles
import '../../styles/global.css';
import '../../styles/typography.css';
import '../../styles/variables.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  type: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  errorMessage?: string;
  label?: string;
  name: string;
  autoComplete?: string;
  validateOnBlur?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  errorMessage,
  label,
  name,
  autoComplete,
  validateOnBlur = true,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue);

    // Clear error when user starts typing
    if (internalError) {
      setInternalError(undefined);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setTouched(true);

    if (validateOnBlur && required && !value) {
      setInternalError('This field is required');
    } else if (validateOnBlur && type === 'email') {
      const isValid = validateAuth({ email: value, password: '', role: 'user' });
      if (!isValid) {
        setInternalError('Please enter a valid email address');
      }
    }

    if (props.onBlur) {
      props.onBlur(event);
    }
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(event);
    }
  };

  const displayError = touched && (errorMessage || internalError);

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing(1.5),
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${displayError 
      ? theme.palette.error.main 
      : isFocused 
        ? theme.palette.primary.main 
        : theme.palette.text.secondary}`,
    borderRadius: theme.shape.borderRadius,
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    outline: 'none',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
    '&:focus': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  };

  const errorStyles: React.CSSProperties = {
    marginTop: theme.spacing(0.5),
    color: theme.palette.error.main,
    fontSize: theme.typography.caption.fontSize,
    minHeight: '20px',
  };

  return (
    <div style={{ marginBottom: theme.spacing(2) }}>
      {label && (
        <label 
          htmlFor={name}
          style={labelStyles}
        >
          {label}
          {required && <span style={{ color: theme.palette.error.main }}> *</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? `${name}-error` : undefined}
        style={inputStyles}
        {...props}
      />
      <div 
        id={`${name}-error`}
        role="alert"
        style={errorStyles}
      >
        {displayError}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  errorMessage: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  autoComplete: PropTypes.string,
  validateOnBlur: PropTypes.bool,
};

export default Input;