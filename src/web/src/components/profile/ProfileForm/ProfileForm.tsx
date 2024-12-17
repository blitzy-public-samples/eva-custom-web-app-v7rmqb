import React from 'react';
import { Stack } from '@mui/material';
import * as yup from 'yup';
import Form from '../../common/Form/Form';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import { useAuth } from '../../../hooks/useAuth';
import { Auth0ContextInterface, User } from '@auth0/auth0-react';

const FORM_FIELDS = {
  NAME: 'name',
  EMAIL: 'email',
  PHONE: 'phone',
  PROVINCE: 'province'
} as const;

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

export interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  province: string;
}

export interface ProfileFormProps {
  onSubmit: (values: ProfileFormData) => void | Promise<void>;
  initialData?: ProfileFormData | null;
  isSubmitting: boolean;
}

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
    .max(254)
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

const ProfileForm: React.FC<ProfileFormProps> = React.memo(({ 
  onSubmit, 
  initialData = null,
  isSubmitting 
}) => {
  const { user } = useAuth();

  const defaultValues: ProfileFormData = {
    name: initialData?.name || user?.name || '',
    email: initialData?.email || user?.email || '',
    phone: initialData?.phone || '',
    province: initialData?.province || ''
  };

  const handleSubmit = async (values: Record<string, any>, auth: Auth0ContextInterface<User>) => {
    try {
      await onSubmit(values as ProfileFormData);
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
      isSubmitting={isSubmitting}
    >
      {(formProps: { values: ProfileFormData; handleChange: (e: React.ChangeEvent<any>) => void; handleBlur: (e: React.FocusEvent<any>) => void }) => (
        <Stack spacing={3} width="100%">
          <Input
            id={FORM_FIELDS.NAME}
            name={FORM_FIELDS.NAME}
            label="Full Name"
            type="text"
            required
            autoComplete="name"
            placeholder="Enter your full name"
            value={formProps.values.name}
            onChange={formProps.handleChange}
          />

          <Input
            id={FORM_FIELDS.EMAIL}
            name={FORM_FIELDS.EMAIL}
            label="Email Address"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email address"
            value={formProps.values.email}
            onChange={formProps.handleChange}
          />

          <Input
            id={FORM_FIELDS.PHONE}
            name={FORM_FIELDS.PHONE}
            label="Phone Number"
            type="tel"
            required
            autoComplete="tel"
            placeholder="Enter your phone number (e.g., 123-456-7890)"
            value={formProps.values.phone}
            onChange={formProps.handleChange}
          />

          <Select
            name={FORM_FIELDS.PROVINCE}
            label="Province"
            required
            placeholder="Select your province"
            options={PROVINCES.map(province => ({
              value: province,
              label: province
            }))}
            value={formProps.values.province}
            onChange={formProps.handleChange}
          />
        </Stack>
      )}
    </Form>
  );
});

ProfileForm.displayName = 'ProfileForm';

export default ProfileForm;