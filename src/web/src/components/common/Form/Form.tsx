import React from 'react'; // v18.2+
import { FormProvider, useForm } from 'react-hook-form'; // v7.0.0
import { Box, Stack, Alert } from '@mui/material'; // v5.11+
import { useAuth0, User } from '@auth0/auth0-react'; // v2.0.0
import * as yup from 'yup';
import { Button } from '../Button/Button';
import { validateLoginPayload, validateRegisterPayload } from '../../../utils/validation.util';
import { Auth0ContextInterface } from '@auth0/auth0-react';

// ARIA labels for accessibility
const ARIA_LABELS = {
  FORM: 'form',
  SUBMIT: 'submit form',
  RESET: 'reset form',
  ERROR: 'form error message',
  LOADING: 'form is processing',
  SUCCESS: 'form submitted successfully'
} as const;

// Form styling constants
const FORM_STYLES = {
  GAP: '16px',
  PADDING: '24px',
  MAX_WIDTH: '600px',
  MOBILE_PADDING: '16px',
  BUTTON_MIN_HEIGHT: '48px',
  ERROR_MARGIN: '8px'
} as const;

// Analytics event tracking constants
const ANALYTICS_EVENTS = {
  FORM_START: 'form_interaction_start',
  FORM_SUBMIT: 'form_submit_attempt',
  FORM_SUCCESS: 'form_submit_success',
  FORM_ERROR: 'form_submit_error',
  FORM_RESET: 'form_reset'
} as const;

// Form component props interface
// Add this interface to define the form render props
export interface FormRenderProps {
  values: Record<string, any>;
  setFieldValue: (field: string, value: any) => void;
}

// Update the Form component props interface to include children as a render prop
export interface FormProps {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>, auth: Auth0ContextInterface<User>) => Promise<void>;
  validationSchema: yup.Schema<any>;
  submitLabel: string;
  showReset?: boolean;
  resetLabel?: string;
  onReset?: () => void;
  isProtected?: boolean;
  analyticsEvent?: string;
  'data-testid'?: string;
  children: (props: FormRenderProps) => React.ReactElement;
}

declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

/**
 * Enhanced form component with comprehensive validation, accessibility,
 * and Auth0 integration optimized for senior users.
 */
const Form: React.FC<FormProps> = React.memo(({
  initialValues,
  onSubmit,
  children,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = false,
  isProtected = false,
  analyticsEvent,
  testId,
  validationSchema
}) => {
  // Auth0 integration
  const auth0Context = useAuth0();
  const { isAuthenticated, getAccessTokenSilently } = auth0Context;

  // Form state management
  const methods = useForm({
    defaultValues: initialValues,
    mode: 'onChange',
    resolver: validationSchema ? async (data, context, options) => {
      try {
        const values = await validationSchema.validate(data, { abortEarly: false });
        return {
          values,
          errors: {}
        };
      } catch (errors) {
        if (errors instanceof yup.ValidationError) {
          return {
            values: {},
            errors: errors.inner.reduce(
              (allErrors: Record<string, { type: string; message: string }>, currentError) => ({
                ...allErrors,
                [currentError.path || '']: {
                  type: currentError.type ?? 'validation',
                  message: currentError.message
                }
              }),
              {}
            )
          };
        }
        return {
          values: {},
          errors: { '': { type: 'validation', message: 'Validation failed' } }
        };
      }
    } : undefined
  });

  const { handleSubmit, reset, formState: { isSubmitting, isDirty } } = methods;
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // Track form interactions for analytics
  React.useEffect(() => {
    if (analyticsEvent && isDirty) {
      window.analytics?.track(ANALYTICS_EVENTS.FORM_START, {
        formType: analyticsEvent
      });
    }
  }, [isDirty, analyticsEvent]);

  // Handle protected route authentication
  React.useEffect(() => {
    if (isProtected && !isAuthenticated) {
      setSubmitError('Authentication required to access this form');
      return;
    }
  }, [isProtected, isAuthenticated]);

  // Form submission handler with validation and Auth0 integration
  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Track submission attempt
      if (analyticsEvent) {
        window.analytics?.track(ANALYTICS_EVENTS.FORM_SUBMIT, {
          formType: analyticsEvent
        });
      }

      // Validate form data based on type
      let validationResult;
      if (analyticsEvent === 'login') {
        validationResult = validateLoginPayload(data as any);
      } else if (analyticsEvent === 'register') {
        validationResult = validateRegisterPayload(data as any);
      } else {
        validationResult = { success: true }; // Fallback to schema validation
      }

      if (!validationResult.success) {
        throw new Error(validationResult.errors?.en[0]);
      }

      // Get Auth0 token for protected routes
      if (isProtected) {
        await getAccessTokenSilently();
      }

      // Submit form data
      await onSubmit(data, auth0Context);

      // Handle success
      setSubmitSuccess(true);
      if (analyticsEvent) {
        window.analytics?.track(ANALYTICS_EVENTS.FORM_SUCCESS, {
          formType: analyticsEvent
        });
      }
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Form submission failed';
      setSubmitError(errorMessage);
      
      if (analyticsEvent) {
        window.analytics?.track(ANALYTICS_EVENTS.FORM_ERROR, {
          formType: analyticsEvent,
          error: errorMessage
        });
      }
    }
  };

  // Handle form reset
  const handleReset = () => {
    reset(initialValues);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (analyticsEvent) {
      window.analytics?.track(ANALYTICS_EVENTS.FORM_RESET, {
        formType: analyticsEvent
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
        sx={{
          maxWidth: FORM_STYLES.MAX_WIDTH,
          padding: {
            xs: FORM_STYLES.MOBILE_PADDING,
            sm: FORM_STYLES.PADDING
          }
        }}
        data-testid={testId}
        role="form"
        aria-label={ARIA_LABELS.FORM}
      >
        <Stack spacing={FORM_STYLES.GAP}>
          {children}

          {/* Error Message */}
          {submitError && (
            <Alert 
              severity="error"
              role="alert"
              aria-label={ARIA_LABELS.ERROR}
              sx={{ marginTop: FORM_STYLES.ERROR_MARGIN }}
            >
              {submitError}
            </Alert>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <Alert 
              severity="success"
              role="alert"
              aria-label={ARIA_LABELS.SUCCESS}
              sx={{ marginTop: FORM_STYLES.ERROR_MARGIN }}
            >
              Form submitted successfully
            </Alert>
          )}

          {/* Form Actions */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }}
            spacing={FORM_STYLES.GAP}
            sx={{ marginTop: FORM_STYLES.GAP }}
          >
            <Button
              type="submit"
              disabled={isSubmitting || (isProtected && !isAuthenticated)}
              loading={isSubmitting}
              fullWidth
              variant="primary"
              size="large"
              ariaLabel={ARIA_LABELS.SUBMIT}
            >
              {submitLabel}
            </Button>

            {showReset && (
              <Button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting || !isDirty}
                variant="outline"
                size="large"
                fullWidth
                ariaLabel={ARIA_LABELS.RESET}
              >
                {resetLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </FormProvider>
  );
});

Form.displayName = 'Form';

export default Form;