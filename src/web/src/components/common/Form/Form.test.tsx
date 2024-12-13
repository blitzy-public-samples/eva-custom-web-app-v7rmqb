import React from 'react'; // v18.2+
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // v14.0.0
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'; // v29.0.0
import userEvent from '@testing-library/user-event'; // v14.0.0
import { axe, toHaveNoViolations } from 'jest-axe'; // v4.7.0
import { useAuth0 } from '@auth0/auth0-react'; // v2.0.0
import Form, { FormProps } from './Form';
import { renderWithProviders } from '../../../utils/test.util';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Auth0
jest.mock('@auth0/auth0-react');
const mockUseAuth0 = useAuth0 as jest.Mock;

// Mock analytics
const mockAnalytics = {
  track: jest.fn(),
};
global.window.analytics = mockAnalytics;

// Constants for testing
const ACCESSIBILITY_CRITERIA = {
  minFontSize: '16px',
  colorContrast: '4.5:1',
  focusIndicatorWidth: '3px',
};

const PERFORMANCE_THRESHOLDS = {
  renderTime: 100, // ms
  submitLatency: 200, // ms
  memoryLimit: 50 * 1024 * 1024, // 50MB
};

// Test setup helper
const setupForm = (overrides: Partial<FormProps> = {}) => {
  const defaultProps: FormProps = {
    initialValues: { email: '', password: '' },
    onSubmit: jest.fn(),
    validationSchema: {},
    children: <div>Form Content</div>,
    submitLabel: 'Submit',
    resetLabel: 'Reset',
    showReset: true,
    isProtected: false,
    analyticsEvent: 'test_form',
    testId: 'test-form',
    ...overrides,
  };

  const auth0Context = {
    isAuthenticated: true,
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
  };

  mockUseAuth0.mockReturnValue(auth0Context);

  return {
    props: defaultProps,
    auth0Context,
    ...renderWithProviders(<Form {...defaultProps} />),
  };
};

describe('Form Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Accessibility Tests', () => {
    it('should have no accessibility violations', async () => {
      const { container } = setupForm();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      setupForm();
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/submit form/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reset form/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      setupForm();
      const form = screen.getByRole('form');
      const submitButton = screen.getByLabelText(/submit form/i);
      const resetButton = screen.getByLabelText(/reset form/i);

      // Test tab order
      await userEvent.tab();
      expect(submitButton).toHaveFocus();
      await userEvent.tab();
      expect(resetButton).toHaveFocus();
    });

    it('should have sufficient color contrast', () => {
      const { container } = setupForm();
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(styles.backgroundColor).toBeDefined();
        expect(styles.color).toBeDefined();
      });
    });
  });

  describe('Security Tests', () => {
    it('should handle protected routes correctly', async () => {
      mockUseAuth0.mockReturnValue({ isAuthenticated: false });
      const { props } = setupForm({ isProtected: true });

      const submitButton = screen.getByLabelText(/submit form/i);
      expect(submitButton).toBeDisabled();

      await userEvent.click(submitButton);
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate form data before submission', async () => {
      const validationSchema = {
        email: (value: string) => value.includes('@') ? null : 'Invalid email',
      };
      const { props } = setupForm({ validationSchema });

      const form = screen.getByRole('form');
      await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
      fireEvent.submit(form);

      expect(props.onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });

    it('should handle Auth0 token retrieval', async () => {
      const { auth0Context, props } = setupForm({ isProtected: true });
      const form = screen.getByRole('form');

      fireEvent.submit(form);
      await waitFor(() => {
        expect(auth0Context.getAccessTokenSilently).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should render within performance threshold', async () => {
      const startTime = performance.now();
      setupForm();
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.renderTime);
    });

    it('should handle form submission within latency threshold', async () => {
      const { props } = setupForm();
      const startTime = performance.now();
      const form = screen.getByRole('form');

      fireEvent.submit(form);
      await waitFor(() => {
        expect(props.onSubmit).toHaveBeenCalled();
      });

      const submitTime = performance.now() - startTime;
      expect(submitTime).toBeLessThan(PERFORMANCE_THRESHOLDS.submitLatency);
    });
  });

  describe('Analytics Tests', () => {
    it('should track form interactions', async () => {
      const { props } = setupForm();
      const form = screen.getByRole('form');

      // Track form start
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      expect(mockAnalytics.track).toHaveBeenCalledWith('form_interaction_start', {
        formType: props.analyticsEvent,
      });

      // Track form submission
      fireEvent.submit(form);
      expect(mockAnalytics.track).toHaveBeenCalledWith('form_submit_attempt', {
        formType: props.analyticsEvent,
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should display error messages accessibly', async () => {
      const { props } = setupForm();
      const error = 'Submission failed';
      
      // Trigger error
      props.onSubmit.mockRejectedValue(new Error(error));
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent(error);
        expect(errorMessage).toHaveAttribute('aria-label', 'form error message');
      });
    });

    it('should clear errors on reset', async () => {
      const { props } = setupForm();
      props.onSubmit.mockRejectedValue(new Error('Error'));

      // Submit form to trigger error
      fireEvent.submit(screen.getByRole('form'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Reset form
      fireEvent.click(screen.getByLabelText(/reset form/i));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Senior-Friendly Features', () => {
    it('should have adequate text size', () => {
      const { container } = setupForm();
      const elements = container.querySelectorAll('button, input, label');
      elements.forEach(element => {
        const fontSize = window.getComputedStyle(element).fontSize;
        expect(parseInt(fontSize)).toBeGreaterThanOrEqual(
          parseInt(ACCESSIBILITY_CRITERIA.minFontSize)
        );
      });
    });

    it('should have clear focus indicators', async () => {
      setupForm();
      const submitButton = screen.getByLabelText(/submit form/i);

      await userEvent.tab();
      expect(submitButton).toHaveFocus();
      const focusStyles = window.getComputedStyle(submitButton);
      expect(focusStyles.outlineWidth).toBe(ACCESSIBILITY_CRITERIA.focusIndicatorWidth);
    });

    it('should provide clear feedback on actions', async () => {
      setupForm();
      const submitButton = screen.getByLabelText(/submit form/i);

      // Test loading state
      fireEvent.click(submitButton);
      expect(screen.getByLabelText(/form is processing/i)).toBeInTheDocument();

      // Test success state
      await waitFor(() => {
        expect(screen.getByLabelText(/form submitted successfully/i)).toBeInTheDocument();
      });
    });
  });
});