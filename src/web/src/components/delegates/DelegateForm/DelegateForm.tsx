import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';
import { Box, Stack, Typography, FormControlLabel, Checkbox } from '@mui/material';
import Form from '../../../components/common/Form/Form';
import Input from '../../../components/common/Input/Input';
import { DelegateRole } from '../../../types/delegate.types';

const ANALYTICS_EVENTS = {
  DELEGATE_FORM_START: 'delegate_form_start',
  DELEGATE_FORM_SUBMIT: 'delegate_form_submit',
  DELEGATE_FORM_SUCCESS: 'delegate_form_success',
  DELEGATE_FORM_ERROR: 'delegate_form_error'
} as const;

interface DelegateData {
  id?: string;
  email: string;
  name: string;
  role: DelegateRole;
  permissions: DelegatePermission[];
  expiresAt: Date | null;
  notes?: string;
}

interface DelegateFormProps {
  delegate?: DelegateData;
  onSuccess: () => void;
  onCancel: () => void;
  onError?: (error: Error) => void;
}

interface DelegatePermission {
  resourceType: 'FINANCIAL' | 'MEDICAL' | 'LEGAL';
  accessLevel: 'READ' | 'WRITE';
}

declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

const INITIAL_VALUES: DelegateData = {
  email: '',
  name: '',
  role: DelegateRole.EXECUTOR,
  permissions: [] as DelegatePermission[],
  expiresAt: null,
  notes: ''
};

const ROLE_PERMISSIONS: Record<DelegateRole, DelegatePermission[]> = {
  [DelegateRole.EXECUTOR]: [
    { resourceType: 'FINANCIAL', accessLevel: 'READ' },
    { resourceType: 'LEGAL', accessLevel: 'READ' }
  ],
  [DelegateRole.HEALTHCARE_PROXY]: [
    { resourceType: 'MEDICAL', accessLevel: 'READ' },
    { resourceType: 'LEGAL', accessLevel: 'READ' }
  ],
  [DelegateRole.FINANCIAL_ADVISOR]: [
    { resourceType: 'FINANCIAL', accessLevel: 'READ' }
  ],
  [DelegateRole.LEGAL_ADVISOR]: [
    { resourceType: 'LEGAL', accessLevel: 'READ' },
    { resourceType: 'FINANCIAL', accessLevel: 'READ' }
  ]
};

const DelegateForm: React.FC<DelegateFormProps> = React.memo(({
  delegate,
  onSuccess,
  onCancel,
  onError
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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
    role: yup.mixed<DelegateRole>()
      .oneOf(Object.values(DelegateRole) as DelegateRole[], t('delegate.form.errors.role.invalid'))
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

  const handleSubmit = useCallback(async (values: DelegateData) => {
    try {
      window.analytics?.track(ANALYTICS_EVENTS.DELEGATE_FORM_SUBMIT, {
        delegateRole: values.role
      });

      const payload = {
        ...values,
        permissions: ROLE_PERMISSIONS[values.role as DelegateRole]
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

      await queryClient.invalidateQueries(['delegates']);

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
      data-testid="delegate-form"
    >
      {({ values, setFieldValue }: { values: DelegateData; setFieldValue: (field: string, value: any) => void }) => (
        <Stack spacing={3}>
          <Typography variant="h6" component="h2">
            {t(delegate ? 'delegate.form.editTitle' : 'delegate.form.createTitle')}
          </Typography>

          <Input
            id="email"
            name="email"
            label={t('delegate.form.email')}
            type="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={(e) => setFieldValue('email', e.target.value)}
          />

          <Input
            id="name"
            name="name"
            label={t('delegate.form.name')}
            required
            autoComplete="name"
            value={values.name}
            onChange={(e) => setFieldValue('name', e.target.value)}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('delegate.form.role')}
            </Typography>
            {Object.values(DelegateRole).map((role: DelegateRole) => (
              <FormControlLabel
                key={String(role)}
                control={
                  <Checkbox
                    name="role"
                    value={role}
                    checked={values.role === role}
                    onChange={(e) => setFieldValue('role', e.target.value)}
                  />
                }
                label={t(`delegate.roles.${role.toLowerCase()}`)}
              />
            ))}
          </Box>

          <Input
            id="expiresAt"
            name="expiresAt"
            label={t('delegate.form.expiresAt')}
            type="text"
            value={values.expiresAt ? new Date(values.expiresAt).toISOString().split('T')[0] : ''}
            onChange={(e) => setFieldValue('expiresAt', e.target.value ? new Date(e.target.value) : null)}
          />

          <Input
            id="notes"
            name="notes"
            label={t('delegate.form.notes')}
            type="text"
            value={values.notes || ''}
            onChange={(e) => setFieldValue('notes', e.target.value)}
          />
        </Stack>
      )}
    </Form>
  );
});

DelegateForm.displayName = 'DelegateForm';

export default DelegateForm;