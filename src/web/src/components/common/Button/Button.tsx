// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards
// 2. Test button component behavior across different viewport sizes
// 3. Validate button accessibility with screen readers
// 4. Ensure proper touch target sizes on mobile devices

// External dependencies
// clsx v1.2.1
import clsx from 'clsx';

// Internal dependencies
import '../../../styles/global.css';
import { theme } from '../../../config/theme.config';
import { validateAuth } from '../../../utils/validation.util';

// Button variant types
type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'text';

// Button props interface
interface ButtonProps {
  /** Text label displayed on the button */
  label: string;
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click event handler */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Type of button - defaults to 'button' */
  type?: 'button' | 'submit' | 'reset';
  /** Aria label for accessibility */
  ariaLabel?: string;
}

/**
 * Reusable Button component that provides consistent styling and behavior.
 * 
 * Addresses requirements:
 * - Frontend Design Consistency: Uses theme-based styling and consistent button variants
 * - Accessibility Compliance: Implements WCAG 2.1 Level AA standards
 * - Responsive Design: Adapts to different screen sizes with appropriate touch targets
 */
const Button = ({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
  className,
  type = 'button',
  ariaLabel,
}: ButtonProps): JSX.Element => {
  // Base button styles using theme configuration
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 500,
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.2s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minWidth: '2.5rem',
    minHeight: '2.5rem', // Ensures minimum touch target size for mobile
  };

  // Variant-specific styles
  const variantStyles = {
    primary: {
      backgroundColor: theme.palette.primary.main,
      color: '#ffffff',
      border: 'none',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
      '&:focus': {
        outline: `3px solid ${theme.palette.primary.light}`,
        outlineOffset: '2px',
      },
    },
    secondary: {
      backgroundColor: theme.palette.secondary.main,
      color: '#ffffff',
      border: 'none',
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
      },
      '&:focus': {
        outline: `3px solid ${theme.palette.secondary.light}`,
        outlineOffset: '2px',
      },
    },
    outlined: {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      border: `1px solid ${theme.palette.primary.main}`,
      '&:hover': {
        backgroundColor: 'rgba(44, 82, 130, 0.05)',
      },
      '&:focus': {
        outline: `3px solid ${theme.palette.primary.light}`,
        outlineOffset: '2px',
      },
    },
    text: {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      border: 'none',
      padding: '0.5rem 1rem',
      '&:hover': {
        backgroundColor: 'rgba(44, 82, 130, 0.05)',
      },
      '&:focus': {
        outline: `3px solid ${theme.palette.primary.light}`,
        outlineOffset: '2px',
      },
    },
  };

  // Disabled state styles
  const disabledStyles = {
    opacity: 0.6,
    cursor: 'not-allowed',
    '&:hover': {
      backgroundColor: variant === 'primary' ? theme.palette.primary.main :
                      variant === 'secondary' ? theme.palette.secondary.main :
                      'transparent',
    },
  };

  // Combine all styles based on props
  const buttonStyles = clsx(
    'button', // Global button styles from global.css
    {
      [`button-${variant}`]: variant,
      'button-disabled': disabled,
    },
    className
  );

  return (
    <button
      type={type}
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-disabled={disabled}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...(disabled && disabledStyles),
      }}
    >
      {label}
    </button>
  );
};

export default Button;