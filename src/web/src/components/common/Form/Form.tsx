/**
 * Estate Kit - Form Component
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application by defining reusable form components.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Provides accessible form components adhering to WCAG 2.1 Level AA standards.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements validation mechanisms to ensure data integrity and prevent invalid inputs.
 * 
 * Human Tasks:
 * 1. Verify form accessibility with screen readers
 * 2. Test keyboard navigation flow
 * 3. Validate error message display meets WCAG guidelines
 * 4. Review form submission handling with backend team
 */

// React v18.2.0
import React, { FormEvent, useState } from 'react';
// prop-types v15.8.1
import PropTypes from 'prop-types';

// Internal imports
import { validateAuth } from '../../utils/validation.util';
import { theme } from '../../config/theme.config';
import { formatDate } from '../../utils/format.util';
import Input from '../Input/Input';

// Import styles
import '../../styles/global.css';

interface FormField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  value: string;
}

interface FormProps {
  title: string;
  fields: FormField[];
  onSubmit: (values: Record<string, string>) => void;
  validateOnBlur?: boolean;
}

const Form: React.FC<FormProps> = ({
  title,
  fields,
  onSubmit,
  validateOnBlur = true,
}) => {
  const [values, setValues] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: field.value }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = 'This field is required';
        isValid = false;
      } else if (field.type === 'email') {
        const isValidEmail = validateAuth({
          email: values[field.name],
          password: '',
          role: 'user'
        });
        if (!isValidEmail) {
          newErrors[field.name] = 'Please enter a valid email address';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'An error occurred while submitting the form'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const titleStyles: React.CSSProperties = {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(3),
    textAlign: 'center',
  };

  const submitButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    opacity: isSubmitting ? 0.7 : 1,
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={formStyles}
      noValidate
      aria-label={title}
    >
      <h2 style={titleStyles}>{title}</h2>
      
      {fields.map(field => (
        <Input
          key={field.name}
          type={field.type}
          name={field.name}
          label={field.label}
          value={values[field.name]}
          onChange={(value) => handleInputChange(field.name, value)}
          required={field.required}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          errorMessage={errors[field.name]}
          validateOnBlur={validateOnBlur}
          aria-required={field.required}
          aria-invalid={!!errors[field.name]}
        />
      ))}

      {errors.submit && (
        <div
          role="alert"
          style={{
            color: theme.palette.error.main,
            marginBottom: theme.spacing(2),
            textAlign: 'center',
          }}
        >
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        style={submitButtonStyles}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

Form.propTypes = {
  title: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      autoComplete: PropTypes.string,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  validateOnBlur: PropTypes.bool,
};

export default Form;