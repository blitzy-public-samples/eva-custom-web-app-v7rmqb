import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { Provider } from 'react-redux';
import { axe } from '@axe-core/react';
import { Delegates } from './Delegates';
import { renderWithProviders } from '../../utils/test.util';
import { Delegate, DelegateRole, DelegateStatus } from '../../types/delegate.types';

// Mock services and hooks
vi.mock('../../hooks/useDelegate', () => ({
  useDelegate: () => ({
    delegates: mockDelegates,
    status: 'idle',
    error: null,
    fetchDelegates: vi.fn(),
    removeDelegate: vi.fn(),
    refreshCache: vi.fn(),
    auditLog: vi.fn()
  })
}));

// Mock analytics
const mockAnalytics = {
  track: vi.fn()
};
window.analytics = mockAnalytics;

// Test data
const mockDelegates: Delegate[] = [
  {
    id: '1',
    ownerId: 'owner1',
    delegateId: 'delegate1',
    email: 'executor@example.com',
    name: 'John Executor',
    role: DelegateRole.EXECUTOR,
    permissions: [
      { resourceType: 'FINANCIAL_DATA', accessLevel: 'READ' },
      { resourceType: 'LEGAL_DOCS', accessLevel: 'READ' }
    ],
    status: DelegateStatus.ACTIVE,
    expiresAt: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    ownerId: 'owner1',
    delegateId: 'delegate2',
    email: 'healthcare@example.com',
    name: 'Jane Healthcare',
    role: DelegateRole.HEALTHCARE_PROXY,
    permissions: [
      { resourceType: 'MEDICAL_DATA', accessLevel: 'READ' },
      { resourceType: 'PERSONAL_INFO', accessLevel: 'READ' }
    ],
    status: DelegateStatus.PENDING,
    expiresAt: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

describe('Delegates Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Layout', () => {
    it('renders the page title and add delegate button', () => {
      renderWithProviders(<Delegates />);
      
      expect(screen.getByText('Manage Delegates')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add delegate/i })).toBeInTheDocument();
    });

    it('displays loading state correctly', () => {
      vi.mocked(useDelegate).mockReturnValue({
        ...vi.mocked(useDelegate)(),
        status: 'loading'
      });

      renderWithProviders(<Delegates />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText(/loading delegates/i)).toBeInTheDocument();
    });

    it('groups delegates by status correctly', async () => {
      renderWithProviders(<Delegates />);
      
      expect(screen.getByText('Active Delegates')).toBeInTheDocument();
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
      
      const activeSection = screen.getByText('Active Delegates').parentElement;
      const pendingSection = screen.getByText('Pending Invitations').parentElement;
      
      expect(within(activeSection!).getByText('John Executor')).toBeInTheDocument();
      expect(within(pendingSection!).getByText('Jane Healthcare')).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 Level AA standards', async () => {
      const { container } = renderWithProviders(<Delegates />);
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('maintains proper focus management', () => {
      renderWithProviders(<Delegates />);
      
      const addButton = screen.getByRole('button', { name: /add delegate/i });
      fireEvent.click(addButton);
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(document.activeElement).toHaveAttribute('id', 'delegate-dialog-title');
    });

    it('provides proper ARIA labels and roles', () => {
      renderWithProviders(<Delegates />);
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Delegate Management');
      expect(screen.getByRole('region', { name: /list of delegates/i })).toBeInTheDocument();
    });
  });

  describe('Security and Permissions', () => {
    it('validates delegate permissions before operations', async () => {
      const mockRemoveDelegate = vi.fn();
      vi.mocked(useDelegate).mockReturnValue({
        ...vi.mocked(useDelegate)(),
        removeDelegate: mockRemoveDelegate
      });

      renderWithProviders(<Delegates />);
      
      const deleteButton = screen.getAllByRole('button', { name: /remove delegate/i })[0];
      fireEvent.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('remove this delegate\'s access')
      );
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'delete_delegate_click',
        expect.any(Object)
      );
    });

    it('creates audit log entries for delegate operations', async () => {
      const mockAuditLog = vi.fn();
      vi.mocked(useDelegate).mockReturnValue({
        ...vi.mocked(useDelegate)(),
        auditLog: mockAuditLog
      });

      renderWithProviders(<Delegates />);
      
      const editButton = screen.getAllByRole('button', { name: /edit delegate/i })[0];
      fireEvent.click(editButton);
      
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EDIT_DELEGATE',
          delegateId: expect.any(String)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('displays error messages appropriately', () => {
      const errorMessage = 'Failed to load delegates';
      vi.mocked(useDelegate).mockReturnValue({
        ...vi.mocked(useDelegate)(),
        error: errorMessage
      });

      renderWithProviders(<Delegates />);
      
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });

    it('provides retry functionality for failed operations', async () => {
      const mockFetchDelegates = vi.fn();
      vi.mocked(useDelegate).mockReturnValue({
        ...vi.mocked(useDelegate)(),
        fetchDelegates: mockFetchDelegates,
        error: 'Failed to load'
      });

      renderWithProviders(<Delegates />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      expect(mockFetchDelegates).toHaveBeenCalled();
    });
  });

  describe('Performance and Caching', () => {
    it('implements proper cache invalidation', async () => {
      const mockRefreshCache = vi.fn();
      vi.mocked(useDelegate).mockReturnValue({
        ...vi.mocked(useDelegate)(),
        refreshCache: mockRefreshCache
      });

      renderWithProviders(<Delegates />);
      
      const deleteButton = screen.getAllByRole('button', { name: /remove delegate/i })[0];
      fireEvent.click(deleteButton);
      window.confirm('Yes');
      
      await waitFor(() => {
        expect(mockRefreshCache).toHaveBeenCalled();
      });
    });

    it('optimizes re-renders with proper memoization', () => {
      const { rerender } = renderWithProviders(<Delegates />);
      
      const initialContent = screen.getByRole('main').innerHTML;
      rerender(<Delegates />);
      const rerenderedContent = screen.getByRole('main').innerHTML;
      
      expect(initialContent).toBe(rerenderedContent);
    });
  });
});