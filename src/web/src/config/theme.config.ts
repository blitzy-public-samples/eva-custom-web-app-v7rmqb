// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards
// 2. Test theme configuration across different viewport sizes
// 3. Validate font loading and fallback behavior
// 4. Ensure theme integration with Material UI components

// Import Material UI dependencies
// @mui/material version 5.11.0
import { createTheme, ThemeOptions } from '@mui/material/styles';

// Import CSS files for design tokens
import '../styles/variables.css';
import '../styles/typography.css';
import '../styles/global.css';

/**
 * Creates the Material UI theme configuration using CSS variables and design tokens.
 * Addresses Frontend Design Consistency requirement from Technical Specifications/3.1 User Interface Design/Design System Specifications
 */
const createThemeConfig = (): ThemeOptions => {
  // Define breakpoints for responsive design
  // Addresses Responsive Design requirement from Technical Specifications/3.1 User Interface Design/Responsive Breakpoints
  const breakpoints = {
    values: {
      xs: 320,
      sm: 576,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  };

  // Define typography configuration
  // Addresses Frontend Design Consistency requirement
  const typography = {
    fontFamily: 'var(--font-family)',
    h1: {
      fontFamily: 'var(--heading-font-family)',
      fontSize: 'var(--font-size-4xl)',
      fontWeight: 'var(--font-weight-bold)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
    h2: {
      fontFamily: 'var(--heading-font-family)',
      fontSize: 'var(--font-size-3xl)',
      fontWeight: 'var(--font-weight-bold)',
      lineHeight: 'var(--line-height-tight)',
    },
    h3: {
      fontFamily: 'var(--heading-font-family)',
      fontSize: 'var(--font-size-2xl)',
      fontWeight: 'var(--font-weight-semibold)',
    },
    h4: {
      fontFamily: 'var(--heading-font-family)',
      fontSize: 'var(--font-size-xl)',
      fontWeight: 'var(--font-weight-semibold)',
    },
    h5: {
      fontFamily: 'var(--heading-font-family)',
      fontSize: 'var(--font-size-lg)',
      fontWeight: 'var(--font-weight-medium)',
    },
    h6: {
      fontFamily: 'var(--heading-font-family)',
      fontSize: 'var(--font-size-base)',
      fontWeight: 'var(--font-weight-medium)',
    },
    body1: {
      fontFamily: 'var(--font-family)',
      fontSize: 'var(--font-size-base)',
      lineHeight: 'var(--line-height-normal)',
    },
    body2: {
      fontFamily: 'var(--font-family)',
      fontSize: 'var(--font-size-sm)',
      lineHeight: 'var(--line-height-normal)',
    },
    button: {
      fontFamily: 'var(--font-family)',
      fontWeight: 'var(--font-weight-medium)',
      textTransform: 'none',
    },
  };

  // Define color palette
  // Addresses Accessibility Compliance requirement from Technical Specifications/3.1 User Interface Design/Accessibility
  const palette = {
    primary: {
      main: 'var(--primary-color)',
      light: 'var(--primary-color-light)',
      dark: 'var(--primary-color-dark)',
      contrastText: '#ffffff',
    },
    secondary: {
      main: 'var(--secondary-color)',
      light: 'var(--secondary-color-light)',
      dark: 'var(--secondary-color-dark)',
      contrastText: '#ffffff',
    },
    error: {
      main: 'var(--error-color)',
    },
    background: {
      default: 'var(--background-color)',
      paper: '#ffffff',
    },
    text: {
      primary: 'var(--text-color)',
      secondary: 'var(--neutral-color)',
    },
  };

  // Define spacing configuration
  const spacing = (factor: number) => `calc(var(--base-spacing) * ${factor})`;

  // Define shape configuration
  const shape = {
    borderRadius: 'var(--border-radius)',
  };

  // Define component overrides for consistent styling
  const components = {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--border-radius)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          transition: 'var(--animation-duration) var(--animation-timing-function)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 'var(--border-radius)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-md)',
        },
      },
    },
  };

  return {
    breakpoints,
    typography,
    palette,
    spacing,
    shape,
    components,
  };
};

// Create and export the theme
// Addresses Frontend Design Consistency requirement
export const theme = createTheme(createThemeConfig());

// Export individual theme sections for specific use cases
export const {
  palette,
  typography,
  spacing,
  shape,
} = theme;