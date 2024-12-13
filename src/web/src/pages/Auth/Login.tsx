import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Alert, 
  CircularProgress, 
  Box 
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import Form from '../../components/common/Form/Form';
import type { LoginPayload } from '../../types/auth.types';

// Constants for accessibility and analytics
const ARIA_LABELS = {
  LOGIN_FORM: 'Estate Kit login form',
  EMAIL_INPUT: 'Email address input',
  PASSWORD_INPUT: 'Password input',
  SUBMIT_BUTTON: 'Sign in to Estate Kit',
  ERROR_MESSAGE: 'Login error message'
} as const;

// Form validation schema
const LOGIN_VALIDATION_SCHEMA = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      message: 'Please enter a valid email address'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters'
    }
  }
};

// Initial form values
const INITIAL_VALUES: LoginPayload = {
  email: '',
  password: ''
};

/**
 * Login page component with enhanced security features and senior-friendly design
 * Implements Auth0-based authentication with PIPEDA compliance
 */
const Login: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  /**
   * Handles form submission with enhanced security and error handling
   * @param formData - Login credentials
   */
  const handleSubmit = async (formData: LoginPayload) => {
    try {
      // Log login attempt (sanitized)
      console.info('Login attempt:', {
        timestamp: new Date().toISOString(),
        email: formData.email.replace(/[^@\w.-]/g, '')
      });

      // Attempt login
      await login(formData);

      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by useAuth hook
      console.error('Login failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        {/* Page Title */}
        <Typography
          component="h1"
          variant="h4"
          align="center"
          sx={{
            fontFamily: 'var(--font-family-heading)',
            color: 'var(--color-text)',
            marginBottom: 'var(--spacing-lg)'
          }}
        >
          Sign In to Estate Kit
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error"
            sx={{ width: '100%', marginBottom: 2 }}
            role="alert"
            aria-label={ARIA_LABELS.ERROR_MESSAGE}
          >
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Form
          initialValues={INITIAL_VALUES}
          onSubmit={handleSubmit}
          validationSchema={LOGIN_VALIDATION_SCHEMA}
          submitLabel={ARIA_LABELS.SUBMIT_BUTTON}
          analyticsEvent="login"
          testId="login-form"
        >
          {/* Form fields are handled by Form component */}
          <input
            type="email"
            name="email"
            aria-label={ARIA_LABELS.EMAIL_INPUT}
            placeholder="Email Address"
            autoComplete="email"
            required
          />
          <input
            type="password"
            name="password"
            aria-label={ARIA_LABELS.PASSWORD_INPUT}
            placeholder="Password"
            autoComplete="current-password"
            required
          />
        </Form>

        {/* Loading Indicator */}
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-12px',
              marginLeft: '-12px'
            }}
          />
        )}

        {/* Help Text */}
        <Typography
          variant="body2"
          align="center"
          sx={{
            marginTop: 'var(--spacing-lg)',
            color: 'var(--color-text-secondary)'
          }}
        >
          Need help? Contact our support team at 1-800-ESTATE-KIT
        </Typography>
      </Box>
    </Container>
  );
});

// Display name for debugging
Login.displayName = 'Login';

export default Login;