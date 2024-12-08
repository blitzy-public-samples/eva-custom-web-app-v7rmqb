/**
 * Estate Kit - User Registration Page
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Enables users to create an account by providing their email and password.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements input validation using validateAuth utility.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Uses reusable components and consistent styling from the design system.
 * 
 * Human Tasks:
 * 1. Configure Auth0 application in Auth0 dashboard
 * 2. Set up environment variables for Auth0 configuration
 * 3. Verify email templates in Auth0 dashboard
 * 4. Test registration flow with various email providers
 */

// React v18.2.0
import React, { useState, useCallback } from 'react';
// prop-types v15.8.1
import PropTypes from 'prop-types';

// Internal imports
import { AuthTypes } from '../../types/auth.types';
import { initializeAuth0 } from '../../config/auth.config';
import { validateAuth } from '../../utils/validation.util';
import Form from '../../components/common/Form/Form';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';

const RegisterPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth0 client
  const auth0Client = initializeAuth0();

  // Form field configuration
  const formFields = [
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      placeholder: 'Enter your email address',
      autoComplete: 'email',
      value: '',
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      required: true,
      placeholder: 'Create a secure password',
      autoComplete: 'new-password',
      value: '',
    },
    {
      name: 'confirmPassword',
      type: 'password',
      label: 'Confirm Password',
      required: true,
      placeholder: 'Confirm your password',
      autoComplete: 'new-password',
      value: '',
    },
  ];

  // Handle form submission
  const handleSubmit = useCallback(async (values: Record<string, string>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate passwords match
      if (values.password !== values.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate input using validateAuth utility
      const authData: AuthTypes = {
        email: values.email,
        password: values.password,
      };

      const isValid = validateAuth(authData);
      if (!isValid) {
        throw new Error('Invalid email or password format');
      }

      // Attempt to create account with Auth0
      await auth0Client.signup({
        email: values.email,
        password: values.password,
        connection: 'Username-Password-Authentication',
      });

      // Redirect to verification page or login
      window.location.href = '/auth/verify-email';

    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  }, [auth0Client]);

  return (
    <div className="register-page">
      <h1>Create Your Account</h1>
      <p>Join Estate Kit to start organizing your estate planning documents securely.</p>

      <Form
        title="Register"
        fields={formFields}
        onSubmit={handleSubmit}
        validateOnBlur={true}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="login-link">
        Already have an account?{' '}
        <a href="/auth/login" className="link">
          Sign in here
        </a>
      </div>

      <div className="terms-notice">
        By creating an account, you agree to our{' '}
        <a href="/terms" className="link">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="link">
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

RegisterPage.propTypes = {
  // No props required as this is a standalone page component
};

export default RegisterPage;