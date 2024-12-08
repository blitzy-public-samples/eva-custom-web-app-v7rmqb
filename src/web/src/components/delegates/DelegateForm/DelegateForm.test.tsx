/**
 * Estate Kit - DelegateForm Component Tests
 * 
 * Requirements addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Tests proper functionality of delegate form for managing delegate access.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Verifies validation mechanisms to ensure data integrity and prevent invalid inputs.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Tests consistent design and theming in the DelegateForm component.
 */

// React v18.2.0
import React from 'react';
// React Testing Library v13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Jest v29.0.0
import '@testing-library/jest-dom';

// Internal imports
import DelegateForm from './DelegateForm';
import useDelegate from '../../hooks/useDelegate';
import { validateDelegate } from '../../utils/validation.util';
import { fetchDelegates, addDelegate, editDelegate, removeDelegate } from '../../redux/slices/delegateSlice';

// Mock the hooks and utilities
jest.mock('../../hooks/useDelegate');
jest.mock('../../utils/validation.util');
jest.mock('../../redux/slices/delegateSlice');

// Mock the redux store
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn()
}));

describe('DelegateForm Component', () => {
  // Setup default props
  const defaultProps = {
    onSubmit: jest.fn(),
  };

  const mockDelegate = {
    delegateId: '123',
    ownerId: '456',
    permissions: [
      {
        permissionId: '789',
        resourceType: 'document',
        accessLevel: 'read'
      }
    ],
    role: 'delegate',
    expiresAt: new Date('2024-12-31')
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    (validateDelegate as jest.Mock).mockReturnValue(true);
    (useDelegate as jest.Mock).mockReturnValue({
      createNewDelegate: jest.fn(),
      updateExistingDelegate: jest.fn(),
      isLoading: false,
      error: null
    });
  });

  describe('Rendering', () => {
    it('renders DelegateForm correctly', () => {
      render(<DelegateForm {...defaultProps} />);
      
      // Verify form title
      expect(screen.getByText('Add New Delegate')).toBeInTheDocument();
      
      // Verify required form fields
      expect(screen.getByLabelText(/Delegate ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Access Expiry Date/i)).toBeInTheDocument();
      
      // Verify permission checkboxes
      expect(screen.getByLabelText(/Document Access/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Medical Information Access/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Financial Information Access/i)).toBeInTheDocument();
    });

    it('renders edit mode correctly with existing delegate data', () => {
      render(<DelegateForm {...defaultProps} delegate={mockDelegate} />);
      
      // Verify form title changes for edit mode
      expect(screen.getByText('Edit Delegate')).toBeInTheDocument();
      
      // Verify form fields are populated with delegate data
      expect(screen.getByLabelText(/Delegate ID/i)).toHaveValue(mockDelegate.delegateId);
      expect(screen.getByLabelText(/Role/i)).toHaveValue(mockDelegate.role);
      
      // Verify permissions are checked
      expect(screen.getByLabelText(/Document Access/i)).toBeChecked();
    });
  });

  describe('Validation', () => {
    it('validates required fields on submit', async () => {
      render(<DelegateForm {...defaultProps} />);
      
      // Submit form without filling required fields
      fireEvent.click(screen.getByText(/Add Delegate/i));
      
      // Verify error messages
      await waitFor(() => {
        expect(screen.getByText(/Please check the form for errors/i)).toBeInTheDocument();
      });
    });

    it('validates delegate data using validateDelegate utility', async () => {
      render(<DelegateForm {...defaultProps} />);
      
      // Fill out form with valid data
      fireEvent.change(screen.getByLabelText(/Delegate ID/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/Role/i), {
        target: { value: 'delegate' }
      });
      
      // Submit form
      fireEvent.click(screen.getByText(/Add Delegate/i));
      
      // Verify validateDelegate was called
      await waitFor(() => {
        expect(validateDelegate).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('handles successful form submission', async () => {
      render(<DelegateForm {...defaultProps} />);
      
      // Fill out form
      fireEvent.change(screen.getByLabelText(/Delegate ID/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/Role/i), {
        target: { value: 'delegate' }
      });
      fireEvent.click(screen.getByLabelText(/Document Access/i));
      
      // Submit form
      fireEvent.click(screen.getByText(/Add Delegate/i));
      
      // Verify onSubmit was called with correct data
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalled();
      });
    });

    it('handles form submission errors', async () => {
      // Mock validation failure
      (validateDelegate as jest.Mock).mockReturnValue(false);
      
      render(<DelegateForm {...defaultProps} />);
      
      // Submit form
      fireEvent.click(screen.getByText(/Add Delegate/i));
      
      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/Please check the form for errors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Redux Integration', () => {
    it('integrates with delegate slice for adding delegates', async () => {
      const mockDispatch = jest.fn();
      (addDelegate as jest.Mock).mockResolvedValue({ payload: mockDelegate });
      
      render(<DelegateForm {...defaultProps} />);
      
      // Fill out and submit form
      fireEvent.change(screen.getByLabelText(/Delegate ID/i), {
        target: { value: mockDelegate.delegateId }
      });
      fireEvent.click(screen.getByText(/Add Delegate/i));
      
      // Verify Redux action was dispatched
      await waitFor(() => {
        expect(addDelegate).toHaveBeenCalled();
      });
    });

    it('integrates with delegate slice for editing delegates', async () => {
      const mockDispatch = jest.fn();
      (editDelegate as jest.Mock).mockResolvedValue({ payload: mockDelegate });
      
      render(<DelegateForm {...defaultProps} delegate={mockDelegate} />);
      
      // Modify and submit form
      fireEvent.change(screen.getByLabelText(/Role/i), {
        target: { value: 'admin' }
      });
      fireEvent.click(screen.getByText(/Save Changes/i));
      
      // Verify Redux action was dispatched
      await waitFor(() => {
        expect(editDelegate).toHaveBeenCalled();
      });
    });
  });
});