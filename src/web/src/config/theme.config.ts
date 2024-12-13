import { createTheme, ThemeOptions } from '@mui/material';
import '../styles/variables.css';

/**
 * Estate Kit Custom Theme Configuration
 * 
 * Creates a senior-friendly Material UI theme that implements:
 * - WCAG 2.1 Level AA compliance
 * - Enhanced visual hierarchy
 * - Larger interactive targets
 * - Improved contrast ratios
 * - Consistent spacing scale
 * 
 * @version MUI 5.11+
 */

const theme = createTheme({
  // Color palette with WCAG AA compliant combinations
  palette: {
    primary: {
      main: 'var(--color-primary)',
      light: 'var(--color-primary-light)',
      dark: 'var(--color-primary-dark)',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: 'var(--color-secondary)',
      light: 'var(--color-secondary-light)',
      dark: 'var(--color-secondary-dark)',
      contrastText: '#FFFFFF',
    },
    error: {
      main: 'var(--color-error)',
      light: 'var(--color-error-light)',
      dark: 'var(--color-error-dark)',
      contrastText: '#FFFFFF',
    },
    text: {
      primary: 'var(--color-text)',
      secondary: 'var(--color-text-secondary)',
    },
    background: {
      default: 'var(--color-background)',
      paper: 'var(--color-background-paper)',
    },
  },

  // Typography with senior-friendly sizing
  typography: {
    fontFamily: 'var(--font-family-base)',
    h1: {
      fontFamily: 'var(--font-family-heading)',
      fontSize: '2.488rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'var(--font-family-heading)',
      fontSize: '2.074rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: 'var(--font-family-heading)',
      fontSize: '1.728rem',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: 'var(--font-family-heading)',
      fontSize: '1.44rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: 'var(--font-family-heading)',
      fontSize: '1.2rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1.125rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '1.125rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },

  // Spacing system based on 8px unit
  spacing: (factor: number) => `${8 * factor}px`,

  // Component customization for accessibility
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '16px 32px',
          borderRadius: 'var(--border-radius-md)',
          minHeight: '48px', // Enhanced touch target
          '&:focus-visible': {
            outline: `3px solid var(--color-primary-light)`,
            outlineOffset: '2px',
          },
        },
        contained: {
          boxShadow: 'var(--box-shadow-md)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontSize: '1.125rem',
            lineHeight: 1.4,
          },
          '& .MuiOutlinedInput-root': {
            minHeight: '48px',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '1.125rem',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
          '& .MuiFormHelperText-root': {
            fontSize: '1rem',
            marginTop: '8px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--box-shadow-md)',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: '12px',
          '& .MuiSvgIcon-root': {
            fontSize: '24px',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: '12px',
          '& .MuiSvgIcon-root': {
            fontSize: '24px',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          minHeight: '48px',
          fontSize: '1.125rem',
          padding: '12px 16px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          minHeight: '48px',
          padding: '12px 24px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--border-radius-md)',
          fontSize: '1.125rem',
          padding: '16px 24px',
        },
      },
    },
  },
} as ThemeOptions);

export default theme;