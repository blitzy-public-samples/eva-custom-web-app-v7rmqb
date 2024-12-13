import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DelegateCard, { DelegateCardProps } from './DelegateCard';
import { renderWithProviders } from '../../../utils/test.util';
import { 
  Delegate, 
  DelegateRole, 
  DelegateStatus, 
  ResourceType, 
  AccessLevel 
} from '../../../types/delegate.types';

// Mock delegate data with comprehensive permissions
const mockDelegate: Delegate = {
  id: 'test-delegate-id',
  ownerId: 'test-owner-id',
  delegateId: 'test-user-id',
  name: 'John Smith',
  email: 'john.smith@example.com',
  role: DelegateRole.EXECUTOR,
  status: DelegateStatus.ACTIVE,
  permissions: [
    { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ }
  ],
  expiresAt: new Date('2025-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastAccess: new Date('2024-02-15T14:30:00Z')
};

// Test setup helper with mock handlers
const setup = (customProps: Partial<DelegateCardProps> = {}) => {
  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn()
  };

  const user = userEvent.setup();

  const props: DelegateCardProps = {
    delegate: mockDelegate,
    onEdit: mockHandlers.onEdit,
    onDelete: mockHandlers.onDelete,
    testId: 'test-delegate-card',
    ...customProps
  };

  const utils = renderWithProviders(<DelegateCard {...props} />);

  return {
    ...utils,
    ...mockHandlers,
    user,
    props
  };
};

describe('DelegateCard Component', () => {
  describe('Rendering and Content Display', () => {
    it('renders delegate information correctly', () => {
      const { getByText, getByTestId } = setup();

      // Verify name and role display
      expect(getByText('John Smith')).toBeInTheDocument();
      expect(getByText('Estate Executor')).toBeInTheDocument();

      // Verify email display
      expect(getByText('john.smith@example.com')).toBeInTheDocument();

      // Verify status chip
      const statusChip = getByTestId('delegate-status-chip');
      expect(statusChip).toHaveTextContent('Active');
      expect(statusChip).toHaveClass('MuiChip-colorSuccess');

      // Verify last access time
      expect(getByText(/Feb 15, 2024 2:30 PM/)).toBeInTheDocument();

      // Verify permissions display
      const permissionsSection = getByTestId('delegate-permissions');
      expect(permissionsSection).toHaveTextContent('Financial Documents (View Only)');
      expect(permissionsSection).toHaveTextContent('Legal Documents (View Only)');
    });

    it('handles loading state correctly', () => {
      const { getByTestId, getByRole } = setup({ loading: true });
      
      expect(getByTestId('test-delegate-card-loading')).toBeInTheDocument();
      expect(getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays error state appropriately', () => {
      const errorMessage = 'Failed to load delegate information';
      const { getByText, getByTestId } = setup({ error: errorMessage });
      
      expect(getByTestId('test-delegate-card-error')).toBeInTheDocument();
      expect(getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('implements proper ARIA roles and labels', () => {
      const { getByRole, getAllByRole } = setup();

      // Verify card role and label
      expect(getByRole('region', { name: /Delegate card for John Smith/i }))
        .toBeInTheDocument();

      // Verify action buttons have proper labels
      const buttons = getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-label', 'Edit delegate access');
      expect(buttons[1]).toHaveAttribute('aria-label', 'Remove delegate access');
    });

    it('supports keyboard navigation', async () => {
      const { user, getByRole, getAllByRole } = setup();

      // Tab to first action button
      await user.tab();
      expect(getAllByRole('button')[0]).toHaveFocus();

      // Tab to second action button
      await user.tab();
      expect(getAllByRole('button')[1]).toHaveFocus();
    });

    it('provides tooltip information for better understanding', async () => {
      const { user, getByRole, findByRole } = setup();

      // Hover over edit button
      const editButton = getByRole('button', { name: /Edit delegate access/i });
      await user.hover(editButton);

      // Verify tooltip appears
      const tooltip = await findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Edit Delegate Access');
    });
  });

  describe('Interaction Handling', () => {
    it('handles edit action correctly', async () => {
      const { user, onEdit, getByRole } = setup();

      const editButton = getByRole('button', { name: /Edit delegate access/i });
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockDelegate.id.toString());
    });

    it('handles delete action correctly', async () => {
      const { user, onDelete, getByRole } = setup();

      const deleteButton = getByRole('button', { name: /Remove delegate access/i });
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(mockDelegate.id.toString());
    });

    it('disables actions when loading', () => {
      const { getByRole } = setup({ loading: true });

      expect(() => getByRole('button', { name: /Edit delegate access/i }))
        .toThrow();
      expect(() => getByRole('button', { name: /Remove delegate access/i }))
        .toThrow();
    });

    it('handles different delegate statuses appropriately', () => {
      const pendingDelegate = {
        ...mockDelegate,
        status: DelegateStatus.PENDING
      };

      const { getByTestId } = setup({ delegate: pendingDelegate });
      
      const statusChip = getByTestId('delegate-status-chip');
      expect(statusChip).toHaveTextContent('Invitation Pending');
      expect(statusChip).toHaveClass('MuiChip-colorWarning');
    });
  });

  describe('Permission Display', () => {
    it('formats permissions correctly for different roles', () => {
      const healthcareProxy = {
        ...mockDelegate,
        role: DelegateRole.HEALTHCARE_PROXY,
        permissions: [
          { resourceType: ResourceType.MEDICAL_DATA, accessLevel: AccessLevel.READ },
          { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ }
        ]
      };

      const { getByTestId } = setup({ delegate: healthcareProxy });
      
      const permissionsSection = getByTestId('delegate-permissions');
      expect(permissionsSection).toHaveTextContent('Medical Records (View Only)');
      expect(permissionsSection).toHaveTextContent('Personal Information (View Only)');
    });

    it('handles empty permissions gracefully', () => {
      const noPermissionsDelegate = {
        ...mockDelegate,
        permissions: []
      };

      const { getByTestId } = setup({ delegate: noPermissionsDelegate });
      
      const permissionsSection = getByTestId('delegate-permissions');
      expect(permissionsSection).toHaveTextContent('No permissions assigned');
    });
  });
});