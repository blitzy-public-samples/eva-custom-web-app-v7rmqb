import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';
import { Box, Stack, Typography, FormControlLabel, Checkbox } from '@mui/material';
import Form from '../../../components/common/Form/Form';
import Input from '../../../components/common/Input/Input';
import { UserRole } from '../../../../../backend/src/types/user.types';

// Analytics event constants
const ANALYTICS_EVENTS = {
  DELEGATE_FORM_START: 'delegate_form_start',
  DELEGATE_FORM_SUBMIT: 'delegate_form_submit',
  DELEGATE_FORM_SUCCESS: 'delegate_form_success',
  DELEGATE_FORM_ERROR: 'delegate_form_error'
} as const;

// Interface for delegate data
interface DelegateData {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: DelegatePermission[];
  expiresAt: Date | null;
  notes: string;
}

// Interface for delegate form props
interface DelegateFormProps {
  delegate?: DelegateData;
  onSuccess: () => void;
  onCancel: () => void;
  onError?: (error: Error) => void;
}

// Interface for delegate permissions
interface DelegatePermission {
  resourceType: 'FINANCIAL' | 'MEDICAL' | 'LEGAL';
  accessLevel: 'READ' | 'WRITE';
}

// Declare analytics interface
declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

// Initial form values
const INITIAL_VALUES = {
  email: '',
  name: '',
  role: UserRole.EXECUTOR,
  permissions: [] as DelegatePermission[],
  expiresAt: null as Date | null,
  notes: ''
};

// Role-based permission presets
const ROLE_PERMISSIONS: Record<UserRole, DelegatePermission[]> = {
  [UserRole.EXECUTOR]: [
    { resourceType: 'FINANCIAL', accessLevel: 'READ' },
    { resourceType: 'LEGAL', accessLevel: 'READ' }
  ],
  [UserRole.HEALTHCARE_PROXY]: [
    { resourceType: 'MEDICAL', accessLevel: 'READ' },
    { resourceType: 'LEGAL', accessLevel: 'READ' }
  ],
  [UserRole.FINANCIAL_ADVISOR]: [
    { resourceType: 'FINANCIAL', accessLevel: 'READ' }
  ],
  [UserRole.LEGAL_ADVISOR]: [
    { resourceType: 'LEGAL', accessLevel: 'READ' },
    { resourceType: 'FINANCIAL', accessLevel: 'READ' }
  ],
  [UserRole.OWNER]: []
};

/**
 * Enhanced form component for creating and managing delegates with comprehensive
 * validation, accessibility features, and security controls.
 */
const DelegateForm: React.FC<DelegateFormProps> = React.memo(({
  delegate,
  onSuccess,
  onCancel,
  onError
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Validation schema with enhanced security rules
  const validationSchema = useMemo(() => yup.object().shape({
    email: yup.string()
      .email(t('delegate.form.errors.email.format'))
      .required(t('delegate.form.errors.email.required'))
      .test('domain-validation', t('delegate.form.errors.email.domain'), 
        value => value ? !value.includes('..') && value.length <= 254 : false),
    name: yup.string()
      .required(t('delegate.form.errors.name.required'))
      .min(2, t('delegate.form.errors.name.min'))
      .max(100, t('delegate.form.errors.name.max'))
      .matches(/^[a-zA-Z\u00c0-\u00ff\s'-]+$/, t('delegate.form.errors.name.format')),
    role: yup.string()
      .oneOf(Object.values(UserRole), t('delegate.form.errors.role.invalid'))
      .required(t('delegate.form.errors.role.required')),
    permissions: yup.array()
      .of(yup.object().shape({
        resourceType: yup.string().required(),
        accessLevel: yup.string().required()
      }))
      .min(1, t('delegate.form.errors.permissions.min'))
      .required(t('delegate.form.errors.permissions.required')),
    expiresAt: yup.date()
      .nullable()
      .min(new Date(), t('delegate.form.errors.expiresAt.min')),
    notes: yup.string()
      .max(500, t('delegate.form.errors.notes.max'))
  }), [t]);

  // Handle form submission with proper error handling and analytics
  const handleSubmit = useCallback(async (values: typeof INITIAL_VALUES, auth: any) => {
    try {
      window.analytics?.track(ANALYTICS_EVENTS.DELEGATE_FORM_SUBMIT, {
        delegateRole: values.role
      });

      const payload = {
        ...values,
        permissions: ROLE_PERMISSIONS[values.role]
      };

      const response = await fetch('/api/delegates', {
        method: delegate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(t('delegate.form.errors.submit'));
      }

      queryClient.invalidateQueries('delegates');

      window.analytics?.track(ANALYTICS_EVENTS.DELEGATE_FORM_SUCCESS, {
        delegateRole: values.role
      });

      onSuccess();
    } catch (error) {
      window.analytics?.track(ANALYTICS_EVENTS.DELEGATE_FORM_ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [delegate, onSuccess, onError, queryClient, t]);

  useEffect(() => {
    window.analytics?.track(ANALYTICS_EVENTS.DELEGATE_FORM_START);
  }, []);

  return (
    <Form
      initialValues={delegate || INITIAL_VALUES}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      submitLabel={t(delegate ? 'delegate.form.update' : 'delegate.form.create')}
      showReset
      resetLabel={t('common.cancel')}
      onReset={onCancel}
      isProtected
      analyticsEvent="delegate_form"
      testId="delegate-form"
    >
      <Stack spacing={3}>
        <Typography variant="h6" component="h2">
          {t(delegate ? 'delegate.form.editTitle' : 'delegate.form.createTitle')}
        </Typography>

        <Input
          name="email"
          id="email"
          label={t('delegate.form.email')}
          type="email"
          required
          autoComplete="email"
        />

        <Input
          name="name"
          id="name"
          label={t('delegate.form.name')}
          required
          autoComplete="name"
        />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('delegate.form.role')}
          </Typography>
          {Object.values(UserRole).map(role => (
            role !== UserRole.OWNER && (
              <FormControlLabel
                key={role}
                control={
                  <Checkbox
                    name="role"
                    value={role}
                    checked={role === UserRole.EXECUTOR}
                  />
                }
                label={t(`delegate.roles.${role.toLowerCase()}`)}
              />
            )
          ))}
        </Box>

        <Input
          name="expiresAt"
          id="expiresAt"
          label={t('delegate.form.expiresAt')}
          type="text"
          InputLabelProps={{ shrink: true }}
        />

        <Input
          name="notes"
          id="notes"
          label={t('delegate.form.notes')}
          type="text"
          rows={4}
        />
      </Stack>
    </Form>
  );
});

DelegateForm.displayName = 'DelegateForm';

export default DelegateForm;