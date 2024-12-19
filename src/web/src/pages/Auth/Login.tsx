import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Alert, 
  CircularProgress, 
  Box,
  TextField,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Form from '../../components/common/Form/Form';
import type { LoginPayload } from '../../types/auth.types';
import * as yup from 'yup';

// Constants for accessibility and analytics
const ARIA_LABELS = {
  LOGIN_FORM: 'Estate Kit login form',
  EMAIL_INPUT: 'Email address input',
  PASSWORD_INPUT: 'Password input',
  SUBMIT_BUTTON: 'Sign in to Estate Kit',
  ERROR_MESSAGE: 'Login error message'
} as const;

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
  const [showPassword, setShowPassword] = React.useState(false);

  /**
   * Handles form submission with enhanced security and error handling
   * @param values - Form values
   */
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      // Log login attempt (sanitized)
      console.info('Login attempt:', {
        timestamp: new Date().toISOString(),
        email: values.email.replace(/[^@\w.-]/g, '')
      });

      const loginData: LoginPayload = {
        email: values.email,
        password: values.password
      };

      // Attempt login
      await login(loginData);

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

  const loginValidationSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required')
  });

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          p: { xs: 2, sm: 4 }
        }}
      >
        {/* Page Title */}
        <Typography
          component="h1"
          variant="h3"
          align="center"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            mb: 2
          }}
        >
          Sign In to Estate Kit
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error"
            sx={{ width: '100%', mb: 2 }}
            role="alert"
            aria-label={ARIA_LABELS.ERROR_MESSAGE}
          >
            {error.toString()}
          </Alert>
        )}

        {/* Login Form */}
        <Form
          initialValues={INITIAL_VALUES}
          onSubmit={handleSubmit}
          submitLabel={ARIA_LABELS.SUBMIT_BUTTON}
          analyticsEvent="login"
          data-testid="login-form"
          validationSchema={loginValidationSchema}
        >
          {({ register }) => (
            <Stack spacing={3} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                {...register('email')}
                type="email"
                label="Email Address"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                  }
                }}
              />
              <TextField
                fullWidth
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                  }
                }}
              />
            </Stack>
          )}
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
            mt: 3,
            color: 'text.secondary'
          }}
        >
          Need help? Contact our support team at{' '}
          <Box
            component="span"
            sx={{
              color: 'primary.main',
              fontWeight: 500
            }}
          >
            1-800-ESTATE-KIT
          </Box>
        </Typography>
      </Box>
    </Container>
  );
});

// Display name for debugging
Login.displayName = 'Login';

export default Login;