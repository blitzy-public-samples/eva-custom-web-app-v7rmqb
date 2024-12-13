import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RegisterPayload, Province } from '../../types/auth.types';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Form from '../../components/common/Form/Form';
import Select from '../../components/common/Select/Select';
import { styled } from '@mui/material/styles';
import { Box, Typography, Alert, Link } from '@mui/material';

// Styled components for enhanced visual hierarchy
const RegisterContainer = styled(Box)(({ theme }) => ({
  maxWidth: '600px',
  margin: '0 auto',
  padding: 'var(--spacing-xl)',
  '@media (max-width: 600px)': {
    padding: 'var(--spacing-md)',
  },
}));

const RegisterHeading = styled(Typography)(({ theme }) => ({
  fontSize: 'calc(var(--font-size-base) * 1.5)',
  fontFamily: 'var(--font-family-heading)',
  color: 'var(--color-text)',
  marginBottom: 'var(--spacing-lg)',
  textAlign: 'center',
}));

// Province options for Canadian users
const provinceOptions = [
  { value: Province.ALBERTA, label: 'Alberta' },
  { value: Province.BRITISH_COLUMBIA, label: 'British Columbia' },
  { value: Province.ONTARIO, label: 'Ontario' },
];

// Initial form state
const initialFormState: RegisterPayload = {
  email: '',
  password: '',
  name: '',
  province: '',
  acceptedTerms: false,
  mfaPreference: true,
};

/**
 * Senior-friendly registration page component with comprehensive security
 * and accessibility features.
 */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle form submission with validation and error handling
  const handleSubmit = useCallback(async (formData: RegisterPayload) => {
    try {
      setFormError(null);

      // Log registration attempt (sanitized)
      console.info('Registration attempt:', {
        timestamp: new Date().toISOString(),
        email: formData.email.replace(/[^@\w.-]/g, ''),
      });

      // Register user
      await register(formData);

      // Navigate to welcome page on success
      navigate('/welcome', {
        state: { message: 'Registration successful! Welcome to Estate Kit.' }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setFormError(errorMessage);
      
      // Log registration failure (sanitized)
      console.error('Registration failed:', {
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });
    }
  }, [register, navigate]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <RegisterContainer>
      <RegisterHeading variant="h1" component="h1">
        Create Your Estate Kit Account
      </RegisterHeading>

      {/* Accessibility announcement for screen readers */}
      <Typography
        className="sr-only"
        aria-live="polite"
        role="status"
      >
        Registration form for Estate Kit. All fields are required unless marked optional.
      </Typography>

      <Form
        initialValues={initialFormState}
        onSubmit={handleSubmit}
        submitLabel="Create Account"
        testId="register-form"
        analyticsEvent="register"
      >
        {/* Name Input */}
        <Input
          id="name"
          label="Full Name"
          type="text"
          required
          autoComplete="name"
          placeholder="Enter your full name"
          error={formError}
          aria-label="Enter your full name"
        />

        {/* Email Input */}
        <Input
          id="email"
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email address"
          error={formError}
          aria-label="Enter your email address"
        />

        {/* Password Input with Toggle */}
        <Input
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          placeholder="Create a secure password"
          error={formError}
          aria-label="Create a secure password"
        />

        {/* Province Selection */}
        <Select
          name="province"
          label="Province"
          options={provinceOptions}
          required
          fullWidth
          helpText="Select your province for jurisdiction-specific features"
          aria-label="Select your province"
        />

        {/* Terms and Conditions */}
        <Box sx={{ marginY: 'var(--spacing-md)' }}>
          <Typography variant="body2" color="textSecondary">
            By creating an account, you agree to our{' '}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Terms of Service (opens in new window)"
            >
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Privacy Policy (opens in new window)"
            >
              Privacy Policy
            </Link>
          </Typography>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error"
            sx={{ marginY: 'var(--spacing-md)' }}
            role="alert"
          >
            {error}
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          loading={loading}
          disabled={loading}
          aria-label="Create your account"
        >
          Create Account
        </Button>

        {/* Login Link */}
        <Box sx={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              href="/login"
              aria-label="Sign in to your existing account"
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Form>
    </RegisterContainer>
  );
};

export default Register;