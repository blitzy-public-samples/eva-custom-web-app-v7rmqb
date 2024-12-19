import { createTheme, ThemeOptions } from '@mui/material';

/**
 * Helper function to get computed CSS variable values
 */
const getCssVar = (variable: string): string => {
  // Get the computed value from the root element
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  
  if (!value) {
    console.warn(`CSS variable ${variable} not found`);
    // Provide fallback colors to prevent theme creation failure
    const fallbacks: { [key: string]: string } = {
      '--color-primary': '#2C5282',
      '--color-primary-light': '#4299E1',
      '--color-primary-dark': '#2A4365',
      '--color-secondary': '#48BB78',
      '--color-secondary-light': '#68D391',
      '--color-secondary-dark': '#2F855A',
      '--color-error': '#E53E3E',
      '--color-error-light': '#FC8181',
      '--color-error-dark': '#C53030',
      '--color-text': '#1A202C',
      '--color-text-secondary': '#4A5568',
      '--color-background': '#FFFFFF',
      '--color-background-paper': '#F7FAFC',
    };
    return fallbacks[variable] || '#000000';
  }
  return value;
};

// Typography configuration
const typography = {
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
};

// Spacing configuration
const spacing = (factor: number) => `${8 * factor}px`;

// Create the theme only after the DOM is ready
export const createAppTheme = () => {
  const palette = {
    primary: {
      main: getCssVar('--color-primary'),
      light: getCssVar('--color-primary-light'),
      dark: getCssVar('--color-primary-dark'),
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: getCssVar('--color-secondary'),
      light: getCssVar('--color-secondary-light'),
      dark: getCssVar('--color-secondary-dark'),
      contrastText: '#FFFFFF',
    },
    error: {
      main: getCssVar('--color-error'),
      light: getCssVar('--color-error-light'),
      dark: getCssVar('--color-error-dark'),
      contrastText: '#FFFFFF',
    },
    text: {
      primary: getCssVar('--color-text'),
      secondary: getCssVar('--color-text-secondary'),
    },
    background: {
      default: getCssVar('--color-background'),
      paper: getCssVar('--color-background-paper'),
    },
  };

  return createTheme({
    palette,
    typography,
    spacing,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '16px 32px',
            borderRadius: 'var(--border-radius-md)',
            minHeight: '48px',
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
};

// Export a default theme for static references
export const theme = createAppTheme();

export default theme;