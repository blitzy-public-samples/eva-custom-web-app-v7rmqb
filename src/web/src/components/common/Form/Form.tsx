import React from 'react'; // v18.2+
import { FormProvider, useForm, useFormState } from 'react-hook-form'; // v7.0.0
import { Box, Stack, Alert, CircularProgress } from '@mui/material'; // v5.11+
import { useAuth0 } from '@auth0/auth0-react'; // v2.0.0
import Input, { InputProps } from '../Input/Input';
import Button, { CustomButtonProps } from '../Button/Button';
import { validateLoginPayload, validateRegisterPayload, validateFormData } from '../../../utils/validation.util';

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
export interface FormProps {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>, auth: Auth0Context) => void | Promise<void>;
  validationSchema: object;
  children: React.ReactNode;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  isProtected?: boolean;
  analyticsEvent?: string;
  testId?: string;
}

/**
 * Enhanced form component with comprehensive validation, accessibility,
 * and Auth0 integration optimized for senior users.
 */
const Form: React.FC<FormProps> = React.memo(({
  initialValues,
  onSubmit,
  validationSchema,
  children,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = false,
  isProtected = false,
  analyticsEvent,
  testId
}) => {
  // Auth0 integration
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  // Form state management
  const methods = useForm({
    defaultValues: initialValues,
    mode: 'onChange'
  });

  const { handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = methods;
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
        validationResult = validateLoginPayload(data);
      } else if (analyticsEvent === 'register') {
        validationResult = validateRegisterPayload(data);
      } else {
        validationResult = validateFormData(data, validationSchema);
      }

      if (!validationResult.success) {
        throw new Error(validationResult.errors?.en[0]);
      }

      // Get Auth0 token for protected routes
      let auth = {};
      if (isProtected) {
        const token = await getAccessTokenSilently();
        auth = { token };
      }

      // Submit form data
      await onSubmit(data, auth);

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
          {/* Form Fields */}
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