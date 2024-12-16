import React from 'react'; // v18.2+
import { Stack } from '@mui/material'; // v5.11+
import * as yup from 'yup'; // ^1.0.0
import Form from '../../common/Form/Form';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import { useAuth } from '../../../hooks/useAuth';
import { User } from '../../../types/auth.types';

// Constants for form field names and validation
const FORM_FIELDS = {
  NAME: 'name',
  EMAIL: 'email',
  PHONE: 'phone',
  PROVINCE: 'province'
} as const;

// List of Canadian provinces
const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan'
] as const;

// Validation messages optimized for senior users
const VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'Please enter your full name',
  NAME_MIN: 'Your name must be at least 2 characters long',
  NAME_INVALID: 'Please use only letters, spaces, and hyphens in your name',
  EMAIL_REQUIRED: 'Please enter your email address',
  EMAIL_INVALID: 'Please enter a valid email address',
  PHONE_REQUIRED: 'Please enter your phone number',
  PHONE_INVALID: 'Please enter a valid Canadian phone number (e.g., 123-456-7890)',
  PROVINCE_REQUIRED: 'Please select your province',
  PROVINCE_INVALID: 'Please select a valid Canadian province'
} as const;

// Interface for form data with strict validation types
export interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  province: string;
}

// Props interface for ProfileForm component
export interface ProfileFormProps {
  onSubmit: (values: ProfileFormData) => void | Promise<void>;
  initialData?: ProfileFormData | null;
}

// Enhanced validation schema with Canadian-specific rules
const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required(VALIDATION_MESSAGES.NAME_REQUIRED)
    .min(2, VALIDATION_MESSAGES.NAME_MIN)
    .matches(/^[a-zA-Z\s-]+$/, VALIDATION_MESSAGES.NAME_INVALID)
    .trim(),
  
  email: yup
    .string()
    .required(VALIDATION_MESSAGES.EMAIL_REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL_INVALID)
    .max(254) // RFC 5321 length limit
    .matches(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, VALIDATION_MESSAGES.EMAIL_INVALID),
  
  phone: yup
    .string()
    .required(VALIDATION_MESSAGES.PHONE_REQUIRED)
    .matches(
      /^(\+?1-?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
      VALIDATION_MESSAGES.PHONE_INVALID
    ),
  
  province: yup
    .string()
    .required(VALIDATION_MESSAGES.PROVINCE_REQUIRED)
    .oneOf(PROVINCES, VALIDATION_MESSAGES.PROVINCE_INVALID)
});

/**
 * Enhanced profile form component with senior-friendly design and accessibility features.
 * Implements comprehensive validation and security measures for user data handling.
 */
const ProfileForm: React.FC<ProfileFormProps> = React.memo(({ 
  onSubmit, 
  initialData = null 
}) => {
  // Get current user data from auth context
  const { user } = useAuth();

  // Initialize form with user's current profile data
  const defaultValues: ProfileFormData = {
    name: initialData?.name || user?.name || '',
    email: initialData?.email || user?.email || '',
    phone: initialData?.phone || '',
    province: initialData?.province || ''
  };

  // Handle form submission with validation
  const handleSubmit = async (values: ProfileFormData) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  return (
    <Form
      initialValues={defaultValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      submitLabel="Save Profile"
      showReset
      resetLabel="Reset Changes"
      isProtected
      analyticsEvent="profile_update"
      testId="profile-form"
    >
      <Stack spacing={3} width="100%">
        <Input
          fieldName={FORM_FIELDS.NAME}
          label="Full Name"
          type="text"
          required
          autoComplete="name"
          placeholder="Enter your full name"
        />

        <Input
          fieldName={FORM_FIELDS.EMAIL}
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email address"
        />

        <Input
          fieldName={FORM_FIELDS.PHONE}
          label="Phone Number"
          type="tel"
          required
          autoComplete="tel"
          placeholder="Enter your phone number (e.g., 123-456-7890)"
        />

        <Select
          fieldName={FORM_FIELDS.PROVINCE}
          label="Province"
          required
          placeholder="Select your province"
          options={PROVINCES.map(province => ({
            value: province,
            label: province
          }))}
        />
      </Stack>
    </Form>
  );
});

// Display name for debugging
ProfileForm.displayName = 'ProfileForm';

export default ProfileForm;