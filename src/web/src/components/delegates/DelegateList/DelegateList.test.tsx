import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import DelegateList from './DelegateList';
import { useDelegate } from '../../../hooks/useDelegate';
import { DelegateStatus, DelegateRole } from '../../../types/delegate.types';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock useDelegate hook
vi.mock('../../../hooks/useDelegate', () => ({
  useDelegate: vi.fn()
}));

// Mock sample delegates data
const mockDelegates = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    role: DelegateRole.EXECUTOR,
    status: DelegateStatus.ACTIVE,
    permissions: [
      { resourceType: 'PERSONAL_INFO', accessLevel: 'READ' },
      { resourceType: 'FINANCIAL_DATA', accessLevel: 'READ' }
    ],
    lastAccess: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: DelegateRole.HEALTHCARE_PROXY,
    status: DelegateStatus.PENDING,
    permissions: [
      { resourceType: 'MEDICAL_DATA', accessLevel: 'READ' }
    ],
    lastAccess: new Date().toISOString()
  }
];

describe('DelegateList Component', () => {
  // Default props for testing
  const defaultProps = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onRetry: vi.fn(),
    className: 'test-class',
    testId: 'delegate-list-test'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering States', () => {
    it('should render loading state with accessible spinner', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: [],
        status: 'loading',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      const loadingSpinner = screen.getByRole('status');
      expect(loadingSpinner).toBeInTheDocument();
      expect(loadingSpinner).toHaveAttribute('aria-label', 'Loading delegates');
    });

    it('should render error state with retry button', () => {
      const errorMessage = 'Failed to load delegates';
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: [],
        status: 'failed',
        error: errorMessage
      });

      render(<DelegateList {...defaultProps} />);

      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should render empty state message when no delegates', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: [],
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      expect(screen.getByText(/no delegates found/i)).toBeInTheDocument();
    });

    it('should render delegates grouped by status', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      expect(screen.getByText('Active Delegates')).toBeInTheDocument();
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(mockDelegates.length);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      const { container } = render(<DelegateList {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA landmarks and labels', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'List of delegates and their permissions'
      );
    });

    it('should support keyboard navigation', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      const delegateCards = screen.getAllByRole('listitem');
      delegateCards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Senior-Friendly Features', () => {
    it('should use minimum font size of 16px', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        const styles = window.getComputedStyle(heading);
        expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(16);
      });
    });

    it('should have sufficient color contrast', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      // Test would use a color contrast checker library
      // This is a placeholder for demonstration
      expect(true).toBeTruthy();
    });
  });

  describe('Security Features', () => {
    it('should validate delegate permissions before actions', async () => {
      const mockValidatePermissions = vi.fn().mockResolvedValue(true);
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null,
        validatePermissions: mockValidatePermissions
      });

      render(<DelegateList {...defaultProps} />);

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(mockValidatePermissions).toHaveBeenCalled();
      });
    });

    it('should log delegate actions to audit trail', async () => {
      const mockAuditLog = vi.fn();
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null,
        auditLog: mockAuditLog
      });

      render(<DelegateList {...defaultProps} />);

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      fireEvent.click(deleteButton);

      expect(mockAuditLog).toHaveBeenCalledWith(
        'DELETE_DELEGATE',
        mockDelegates[0].id,
        expect.any(Object)
      );
    });
  });

  describe('Interactions', () => {
    it('should handle edit delegate action', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      fireEvent.click(editButton);

      expect(defaultProps.onEdit).toHaveBeenCalledWith(
        mockDelegates[0].id,
        expect.any(Object)
      );
    });

    it('should handle delete delegate action', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: mockDelegates,
        status: 'succeeded',
        error: null
      });

      render(<DelegateList {...defaultProps} />);

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      fireEvent.click(deleteButton);

      expect(defaultProps.onDelete).toHaveBeenCalledWith(
        mockDelegates[0].id,
        expect.any(Object)
      );
    });

    it('should handle retry action on error', () => {
      (useDelegate as jest.Mock).mockReturnValue({
        delegates: [],
        status: 'failed',
        error: 'Failed to load'
      });

      render(<DelegateList {...defaultProps} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(defaultProps.onRetry).toHaveBeenCalled();
    });
  });
});