import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RegisterPayload, Province } from '../../types/auth.types';
import Input from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import Form from '../../components/common/Form/Form';
import Select from '../../components/common/Select/Select';
import { styled } from '@mui/material/styles';
import { Box, Typography, Alert, Link } from '@mui/material';
import * as Yup from 'yup';
import { Auth0ContextInterface, User } from '@auth0/auth0-react';

const RegisterContainer = styled(Box)(() => ({
  maxWidth: '600px',
  margin: '0 auto',
  padding: 'var(--spacing-xl)',
  '@media (max-width: 600px)': {
    padding: 'var(--spacing-md)',
  },
}));

const RegisterHeading = styled(Typography)(() => ({
  fontSize: 'calc(var(--font-size-base) * 1.5)',
  fontFamily: 'var(--font-family-heading)',
  color: 'var(--color-text)',
  marginBottom: 'var(--spacing-lg)',
  textAlign: 'center',
}));

const provinceOptions = [
  { value: Province.ALBERTA, label: 'Alberta' },
  { value: Province.BRITISH_COLUMBIA, label: 'British Columbia' },
  { value: Province.ONTARIO, label: 'Ontario' },
];

const initialFormState: RegisterPayload = {
  email: '',
  password: '',
  name: '',
  province: Province.ONTARIO,
  acceptedTerms: false,
  mfaPreference: false,
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
  name: Yup.string().required('Name is required'),
  province: Yup.string().required('Province is required'),
  acceptedTerms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
});

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const handleSubmit = useCallback(async (values: Record<string, any>, auth: Auth0ContextInterface<User>) => {
    try {
      setFormError(undefined);

      console.info('Registration attempt:', {
        timestamp: new Date().toISOString(),
        email: values.email.replace(/[^@\w.-]/g, ''),
      });

      const formData: RegisterPayload = {
        email: values.email,
        password: values.password,
        name: values.name,
        province: values.province,
        acceptedTerms: values.acceptedTerms,
        mfaPreference: false,
      };

      await register(formData);

      navigate('/welcome', {
        state: { message: 'Registration successful! Welcome to Estate Kit.' }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setFormError(errorMessage);
      
      console.error('Registration failed:', {
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });
    }
  }, [register, navigate]);

  const renderForm = (formProps: { values: Record<string, any>; handleChange: (e: any) => void }) => (
    <>
      <Input
        id="name"
        label="Full Name"
        type="text"
        required
        autoComplete="name"
        placeholder="Enter your full name"
        error={formError}
        aria-label="Enter your full name"
        value={formProps.values.name}
        onChange={formProps.handleChange}
      />

      <Input
        id="email"
        label="Email Address"
        type="email"
        required
        autoComplete="email"
        placeholder="Enter your email address"
        error={formError}
        aria-label="Enter your email address"
        value={formProps.values.email}
        onChange={formProps.handleChange}
      />

      <Input
        id="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        required
        autoComplete="new-password"
        placeholder="Create a secure password"
        error={formError}
        aria-label="Create a secure password"
        value={formProps.values.password}
        onChange={formProps.handleChange}
      />

      <Select
        name="province"
        label="Province"
        options={provinceOptions}
        required
        fullWidth
        helpText="Select your province for jurisdiction-specific features"
        aria-label="Select your province"
        value={formProps.values.province}
        onChange={(value) => formProps.handleChange({ target: { name: 'province', value } })}
        onBlur={() => {}}
      />

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

      {error && (
        <Alert 
          severity="error"
          sx={{ marginY: 'var(--spacing-md)' }}
          role="alert"
        >
          {error.toString()}
        </Alert>
      )}

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
    </>
  );

  return (
    <RegisterContainer>
      <RegisterHeading>
        Create Your Estate Kit Account
      </RegisterHeading>

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
        validationSchema={validationSchema}
      >
        {(props) => renderForm(props)}
      </Form>
    </RegisterContainer>
  );
};

export default Register;