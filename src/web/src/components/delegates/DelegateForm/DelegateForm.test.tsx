import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // v14.0.0
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DelegateForm, { DelegateFormProps } from './DelegateForm';
import { useDelegate } from '../../../hooks/useDelegate';
import { 
  DelegateRole, 
  ResourceType, 
  AccessLevel,
  CreateDelegateDTO,
  UpdateDelegateDTO 
} from '../../../types/delegate.types';

// Mock useDelegate hook
jest.mock('../../../hooks/useDelegate');

// Mock store configuration
const mockStore = configureStore({
  reducer: {
    delegates: (state = { items: [], loading: false, error: null }) => state
  }
});

// Helper function to render component with Redux store
const renderWithRedux = (component: JSX.Element, initialState = {}) => {
  const store = configureStore({
    reducer: {
      delegates: (state = initialState) => state
    }
  });

  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Test setup and cleanup
describe('DelegateForm Component', () => {
  // Mock data
  const mockDelegate = {
    id: '123',
    email: 'delegate@example.com',
    name: 'John Doe',
    role: DelegateRole.EXECUTOR,
    permissions: [
      { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.READ },
      { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ }
    ],
    expiresAt: new Date('2024-12-31')
  };

  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    (useDelegate as jest.Mock).mockReturnValue({
      createDelegate: jest.fn(),
      updateDelegate: jest.fn(),
      loading: false,
      error: null
    });
  });

  describe('Form Rendering', () => {
    test('renders all form fields with proper labels and ARIA attributes', () => {
      renderWithRedux(
        <DelegateForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Verify essential form fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();

      // Verify ARIA attributes
      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'delegate form');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true');
    });

    test('displays role-specific permission options based on selected role', async () => {
      renderWithRedux(
        <DelegateForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Select Executor role
      const roleSelect = screen.getByLabelText(/role/i);
      await userEvent.selectOptions(roleSelect, DelegateRole.EXECUTOR);

      // Verify Executor-specific permissions are displayed
      expect(screen.getByText(/financial documents/i)).toBeInTheDocument();
      expect(screen.getByText(/legal documents/i)).toBeInTheDocument();
      expect(screen.queryByText(/medical information/i)).not.toBeInTheDocument();
    });

    test('renders in edit mode with existing delegate data populated', () => {
      renderWithRedux(
        <DelegateForm
          delegate={mockDelegate}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Verify form is populated with delegate data
      expect(screen.getByLabelText(/email/i)).toHaveValue(mockDelegate.email);
      expect(screen.getByLabelText(/name/i)).toHaveValue(mockDelegate.name);
      expect(screen.getByLabelText(/role/i)).toHaveValue(mockDelegate.role);
    });
  });

  describe('Role-Based Permissions', () => {
    test('validates Executor role has access to financial and legal documents', async () => {
      const { createDelegate } = useDelegate();
      renderWithRedux(
        <DelegateForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Fill form with Executor data
      await userEvent.type(screen.getByLabelText(/email/i), 'executor@example.com');
      await userEvent.type(screen.getByLabelText(/name/i), 'Executor Name');
      await userEvent.selectOptions(screen.getByLabelText(/role/i), DelegateRole.EXECUTOR);

      // Submit form
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify correct permissions are set
      expect(createDelegate).toHaveBeenCalledWith(
        expect.objectContaining({
          role: DelegateRole.EXECUTOR,
          permissions: expect.arrayContaining([
            { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.READ },
            { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ }
          ])
        })
      );
    });

    // Additional role-based permission tests...
  });

  describe('Form Submission', () => {
    test('successfully submits new delegate creation', async () => {
      const { createDelegate } = useDelegate();
      (createDelegate as jest.Mock).mockResolvedValueOnce({ success: true });

      renderWithRedux(
        <DelegateForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Fill form
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
      await userEvent.selectOptions(screen.getByLabelText(/role/i), DelegateRole.EXECUTOR);

      // Submit form
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify submission
      await waitFor(() => {
        expect(createDelegate).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('displays API errors with clear user feedback', async () => {
      const { createDelegate } = useDelegate();
      const errorMessage = 'Failed to create delegate';
      (createDelegate as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      renderWithRedux(
        <DelegateForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Accessibility', () => {
    test('maintains keyboard focus management', async () => {
      renderWithRedux(
        <DelegateForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Verify tab order
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      
      userEvent.tab();
      expect(document.activeElement).toBe(nameInput);
    });

    test('provides clear error messages to screen readers', async () => {
      renderWithRedux(
        <DelegateForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Submit empty form
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify error messages are accessible
      const errors = await screen.findAllByRole('alert');
      errors.forEach(error => {
        expect(error).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});