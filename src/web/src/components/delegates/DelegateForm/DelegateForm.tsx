/**
 * Estate Kit - DelegateForm Component
 * 
 * Requirements addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Provides a user interface for managing delegate access, including adding or editing delegate information.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application by using reusable components.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Adheres to WCAG 2.1 Level AA standards for accessible forms.
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
import React, { useState, useCallback } from 'react';
// prop-types v15.8.1
import PropTypes from 'prop-types';

// Internal imports
import { DelegateTypes } from '../../types/delegate.types';
import { validateDelegate } from '../../utils/validation.util';
import Form from '../common/Form/Form';
import Input from '../common/Input/Input';
import Button from '../common/Button/Button';

interface DelegateFormProps {
  delegate?: DelegateTypes;
  onSubmit: (delegate: DelegateTypes) => void;
}

const DelegateForm: React.FC<DelegateFormProps> = ({ delegate, onSubmit }) => {
  // Initialize form state with existing delegate data or defaults
  const [formData, setFormData] = useState<DelegateTypes>({
    delegateId: delegate?.delegateId || '',
    ownerId: delegate?.ownerId || '',
    permissions: delegate?.permissions || [],
    role: delegate?.role || 'delegate',
    expiresAt: delegate?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year expiry
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle form field changes
  const handleChange = useCallback((field: keyof DelegateTypes, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate form data
    if (!validateDelegate(formData)) {
      setErrors({
        form: 'Please check the form for errors and try again.'
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({
        form: 'An error occurred while saving the delegate information.'
      });
      console.error('Delegate form submission error:', error);
    }
  }, [formData, onSubmit]);

  // Define form fields
  const formFields = [
    {
      name: 'delegateId',
      type: 'text',
      label: 'Delegate ID',
      value: formData.delegateId,
      required: true,
      placeholder: 'Enter delegate ID or email',
      autoComplete: 'off'
    },
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      value: formData.role,
      required: true,
      options: [
        { value: 'delegate', label: 'Delegate' },
        { value: 'admin', label: 'Administrator' },
        { value: 'user', label: 'Regular User' }
      ]
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Access Expiry Date',
      value: formData.expiresAt.toISOString().split('T')[0],
      required: true,
      min: new Date().toISOString().split('T')[0]
    }
  ];

  // Permission checkboxes for different resource types
  const permissionFields = [
    {
      name: 'permissions-documents',
      type: 'checkbox',
      label: 'Document Access',
      value: formData.permissions.some(p => p.resourceType === 'document'),
      onChange: (checked: boolean) => {
        const newPermissions = checked
          ? [...formData.permissions, {
              permissionId: crypto.randomUUID(),
              resourceType: 'document',
              accessLevel: 'read'
            }]
          : formData.permissions.filter(p => p.resourceType !== 'document');
        handleChange('permissions', newPermissions);
      }
    },
    {
      name: 'permissions-medical',
      type: 'checkbox',
      label: 'Medical Information Access',
      value: formData.permissions.some(p => p.resourceType === 'medical'),
      onChange: (checked: boolean) => {
        const newPermissions = checked
          ? [...formData.permissions, {
              permissionId: crypto.randomUUID(),
              resourceType: 'medical',
              accessLevel: 'read'
            }]
          : formData.permissions.filter(p => p.resourceType !== 'medical');
        handleChange('permissions', newPermissions);
      }
    },
    {
      name: 'permissions-financial',
      type: 'checkbox',
      label: 'Financial Information Access',
      value: formData.permissions.some(p => p.resourceType === 'financial'),
      onChange: (checked: boolean) => {
        const newPermissions = checked
          ? [...formData.permissions, {
              permissionId: crypto.randomUUID(),
              resourceType: 'financial',
              accessLevel: 'read'
            }]
          : formData.permissions.filter(p => p.resourceType !== 'financial');
        handleChange('permissions', newPermissions);
      }
    }
  ];

  return (
    <Form
      title={delegate ? 'Edit Delegate' : 'Add New Delegate'}
      fields={[...formFields, ...permissionFields]}
      onSubmit={handleSubmit}
      validateOnBlur={true}
      aria-label={delegate ? 'Edit delegate form' : 'Add new delegate form'}
    >
      {errors.form && (
        <div 
          role="alert" 
          aria-live="polite" 
          className="error-message"
        >
          {errors.form}
        </div>
      )}
      
      <div className="form-actions">
        <Button
          label="Cancel"
          variant="outlined"
          onClick={() => window.history.back()}
          ariaLabel="Cancel and go back"
        />
        <Button
          label={delegate ? 'Save Changes' : 'Add Delegate'}
          variant="primary"
          type="submit"
          ariaLabel={delegate ? 'Save delegate changes' : 'Add new delegate'}
        />
      </div>
    </Form>
  );
};

DelegateForm.propTypes = {
  delegate: PropTypes.shape({
    delegateId: PropTypes.string.isRequired,
    ownerId: PropTypes.string.isRequired,
    permissions: PropTypes.arrayOf(PropTypes.shape({
      permissionId: PropTypes.string.isRequired,
      resourceType: PropTypes.string.isRequired,
      accessLevel: PropTypes.string.isRequired
    })).isRequired,
    role: PropTypes.oneOf(['user', 'admin', 'delegate']).isRequired,
    expiresAt: PropTypes.instanceOf(Date).isRequired
  }),
  onSubmit: PropTypes.func.isRequired
};

export default DelegateForm;