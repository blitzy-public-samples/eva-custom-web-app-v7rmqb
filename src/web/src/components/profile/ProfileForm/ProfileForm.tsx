/**
 * Estate Kit - Profile Form Component
 * 
 * Human Tasks:
 * 1. Verify form validation rules with backend team
 * 2. Test form accessibility with screen readers
 * 3. Validate error message display and color contrast
 * 4. Review form submission error handling
 */

// React v18.2.0
import React, { useState, FormEvent } from 'react';

// Internal dependencies
import Input from '../common/Input/Input';
import Button from '../common/Button/Button';
import { AuthTypes } from '../../types/auth.types';
import { validateAuth } from '../../utils/validation.util';
import { login } from '../../services/auth.service';
import { theme } from '../../config/theme.config';

/**
 * ProfileForm component for managing user profile information.
 * 
 * Requirements addressed:
 * - User Profile Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Allows users to update their personal information securely
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Uses consistent theming and reusable components
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Implements WCAG 2.1 Level AA compliant form controls
 */
const ProfileForm: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<Partial<AuthTypes>>({
    email: '',
    role: 'user'
  });

  // Error state
  const [errors, setErrors] = useState<{
    email?: string;
    role?: string;
    submit?: string;
  }>({});

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form styles
  const formStyles: React.CSSProperties = {
    maxWidth: '480px',
    margin: '0 auto',
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const headingStyles: React.CSSProperties = {
    color: theme.palette.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: theme.spacing(3)
  };

  // Handle input changes
  const handleInputChange = (field: keyof AuthTypes) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateAuth({ ...formData as AuthTypes })) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Attempt to update profile
      await login(formData as AuthTypes);
      
      // Show success message or redirect
      window.location.href = '/profile/success';
    } catch (error) {
      setErrors({
        submit: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      style={formStyles}
      noValidate
      aria-label="Profile Update Form"
    >
      <h2 style={headingStyles}>Update Profile</h2>

      {errors.submit && (
        <div
          role="alert"
          style={{
            color: theme.palette.error.main,
            marginBottom: theme.spacing(2),
            padding: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
            backgroundColor: `${theme.palette.error.main}1A`
          }}
        >
          {errors.submit}
        </div>
      )}

      <Input
        type="email"
        name="email"
        label="Email Address"
        value={formData.email || ''}
        onChange={handleInputChange('email')}
        errorMessage={errors.email}
        required
        autoComplete="email"
        placeholder="Enter your email address"
        aria-describedby={errors.email ? 'email-error' : undefined}
      />

      <Input
        type="text"
        name="role"
        label="Role"
        value={formData.role || ''}
        onChange={handleInputChange('role')}
        errorMessage={errors.role}
        required
        autoComplete="off"
        placeholder="Select your role"
        aria-describedby={errors.role ? 'role-error' : undefined}
      />

      <div style={{ marginTop: theme.spacing(3) }}>
        <Button
          type="submit"
          label={isSubmitting ? 'Updating...' : 'Update Profile'}
          disabled={isSubmitting}
          variant="primary"
          ariaLabel="Update profile information"
        />
      </div>
    </form>
  );
};

export default ProfileForm;