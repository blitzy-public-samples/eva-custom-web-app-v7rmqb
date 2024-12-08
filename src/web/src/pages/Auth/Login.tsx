/**
 * Estate Kit - Login Page Component
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements the login functionality for users to authenticate and access the application.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming for the login page using reusable components.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Validates user input to ensure data integrity and prevent invalid or malicious inputs.
 * 
 * Human Tasks:
 * 1. Configure Auth0 application settings in the Auth0 dashboard
 * 2. Set up environment variables for Auth0 configuration
 * 3. Test login functionality with different user roles
 * 4. Verify error message display and validation behavior
 */

// React v18.2.0
import React, { useState, useEffect } from 'react';

// Internal dependencies
import { AuthTypes } from '../../types/auth.types';
import { initializeAuth0 } from '../../config/auth.config';
import { login } from '../../services/auth.service';
import { validateAuth } from '../../utils/validation.util';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';

const Login = (): JSX.Element => {
  // State management for form fields and errors
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize Auth0 on component mount
  useEffect(() => {
    try {
      initializeAuth0();
    } catch (error) {
      console.error('Auth0 initialization failed:', error);
      setError('Authentication service initialization failed');
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate form inputs
      const credentials: AuthTypes = {
        email,
        password,
        role: 'user' // Default role for login
      };

      if (!validateAuth(credentials)) {
        throw new Error('Invalid email or password format');
      }

      // Attempt login
      await login(credentials);

      // Redirect to dashboard on success
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: 'var(--background-color)'
  };

  // Form styles
  const formStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)'
  };

  // Heading styles
  const headingStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--text-color)',
    marginBottom: '2rem',
    textAlign: 'center'
  };

  // Error message styles
  const errorStyle: React.CSSProperties = {
    color: 'var(--error-color)',
    fontSize: 'var(--font-size-sm)',
    marginTop: '1rem',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <h1 style={headingStyle}>Welcome to Estate Kit</h1>
        
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            label="Email Address"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
            required
            autoComplete="email"
            validateOnBlur
          />

          <Input
            type="password"
            name="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            validateOnBlur
          />

          {error && <div style={errorStyle} role="alert">{error}</div>}

          <Button
            type="submit"
            label={isLoading ? 'Signing in...' : 'Sign In'}
            variant="primary"
            disabled={isLoading}
            className="fadeIn"
          />

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button
              type="button"
              label="Forgot Password?"
              variant="text"
              onClick={() => window.location.href = '/forgot-password'}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;