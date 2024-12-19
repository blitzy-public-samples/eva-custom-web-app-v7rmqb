import React from 'react'; // v18.2.0
import { styled } from '@mui/material/styles'; // v5.11.0
import ButtonBase from '@mui/material/ButtonBase'; // v5.11.0
import CircularProgress from '@mui/material/CircularProgress'; // v5.11.0
import { SxProps, Theme } from '@mui/material';

// Interface for button props with comprehensive options
interface CustomButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactElement;
  endIcon?: React.ReactElement;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  disableRipple?: boolean;
  prefersReducedMotion?: boolean;
  sx?: SxProps<Theme>;
}

// Styled button component with comprehensive styling options
const StyledButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => 
    !['variant', 'size', 'loading', 'prefersReducedMotion'].includes(String(prop)),
})<CustomButtonProps>(({ variant, size, disabled, loading, fullWidth, prefersReducedMotion }) => ({
  fontFamily: 'var(--font-family-base)',
  borderRadius: 'var(--border-radius-md)',
  transition: prefersReducedMotion ? 'none' : 'all 0.2s ease-in-out',
  cursor: loading ? 'wait' : disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--spacing-unit)',
  position: 'relative',
  minWidth: '44px', // WCAG target size
  minHeight: '44px', // WCAG target size
  width: fullWidth ? '100%' : 'auto',
  padding: size === 'small' ? 'var(--spacing-sm) var(--spacing-md)' :
          size === 'large' ? 'var(--spacing-lg) var(--spacing-xl)' :
          'var(--spacing-md) var(--spacing-lg)',
  fontSize: size === 'small' ? 'calc(var(--font-size-base) * 0.875)' :
           size === 'large' ? 'calc(var(--font-size-base) * 1.125)' :
           'var(--font-size-base)',
  
  // Variant-specific styles
  ...(variant === 'primary' && {
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    border: 'none',
    '&:hover': !disabled && {
      backgroundColor: 'var(--color-primary-dark)',
      transform: prefersReducedMotion ? 'none' : 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: '3px solid var(--color-primary-light)',
      outlineOffset: '2px',
    },
  }),

  ...(variant === 'secondary' && {
    backgroundColor: 'var(--color-secondary)',
    color: '#FFFFFF',
    border: 'none',
    '&:hover': !disabled && {
      backgroundColor: 'var(--color-secondary-dark)',
      transform: prefersReducedMotion ? 'none' : 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: '3px solid var(--color-secondary-light)',
      outlineOffset: '2px',
    },
  }),

  ...(variant === 'outline' && {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: '2px solid var(--color-primary)',
    '&:hover': !disabled && {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
    },
    '&:focus-visible': {
      outline: '3px solid var(--color-primary-light)',
      outlineOffset: '2px',
    },
  }),

  ...(variant === 'text' && {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: 'none',
    '&:hover': !disabled && {
      backgroundColor: 'var(--color-primary-light)',
      textDecoration: 'underline',
    },
    '&:focus-visible': {
      outline: '3px solid var(--color-primary-light)',
      outlineOffset: '2px',
    },
  }),

  // State-specific styles
  ...(disabled && {
    opacity: 0.6,
    pointerEvents: 'none',
  }),

  ...(loading && {
    color: 'transparent',
  }),
}));

// Loading spinner styles
const StyledSpinner = styled(CircularProgress)({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'inherit',
});

export const Button: React.FC<CustomButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  ariaLabel,
  disableRipple = false,
  prefersReducedMotion = false,
  sx,
  ...props
}) => {
  // Check if user prefers reduced motion
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      prefersReducedMotion = true;
    }
  }, []);

  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      fullWidth={fullWidth}
      onClick={onClick}
      type={type}
      disableRipple={disableRipple || prefersReducedMotion}
      prefersReducedMotion={prefersReducedMotion}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      role="button"
      sx={sx}
      {...props}
    >
      {startIcon && !loading && (
        <span className="button-start-icon" aria-hidden="true">
          {startIcon}
        </span>
      )}
      {children}
      {endIcon && !loading && (
        <span className="button-end-icon" aria-hidden="true">
          {endIcon}
        </span>
      )}
      {loading && <StyledSpinner size={24} />}
    </StyledButton>
  );
};

export type { CustomButtonProps };