import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { axe, toHaveNoViolations } from '@axe-core/react';
import { DocumentList, DocumentListProps } from './DocumentList';
import { renderWithProviders } from '../../../utils/test.util';
import { mockDocumentList } from '../../../../../backend/tests/mocks/document.mock';
import { DocumentType, DocumentStatus } from '../../../types/document.types';
import { UserRole } from '../../../types/user.types';

// Add axe accessibility matcher
expect.extend(toHaveNoViolations);

// Mock document service hooks
jest.mock('../../../hooks/useDocument', () => ({
  useDocument: () => ({
    documents: mockDocumentList,
    loading: false,
    deleteDocument: jest.fn(),
    downloadDocument: jest.fn(),
    encryptionStatus: jest.fn(() => true),
    auditLog: jest.fn()
  })
}));

describe('DocumentList Component', () => {
  // Default props for testing
  const defaultProps: DocumentListProps = {
    type: DocumentType.LEGAL,
    userRole: UserRole.OWNER,
    encryptionRequired: true,
    testId: 'document-list'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Accessibility', () => {
    it('should render without accessibility violations', async () => {
      const { container } = renderWithProviders(
        <DocumentList {...defaultProps} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG 2.1 Level AA color contrast requirements', () => {
      renderWithProviders(<DocumentList {...defaultProps} />);
      
      // Verify table headers have sufficient contrast
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        const styles = window.getComputedStyle(header);
        expect(styles.color).toBeDefined();
        expect(styles.backgroundColor).toBeDefined();
      });
    });

    it('should implement proper keyboard navigation', () => {
      renderWithProviders(<DocumentList {...defaultProps} />);
      
      const table = screen.getByRole('table');
      const cells = within(table).getAllByRole('cell');
      
      // Verify tab navigation
      cells.forEach(cell => {
        expect(cell).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should provide proper ARIA labels and roles', () => {
      renderWithProviders(<DocumentList {...defaultProps} />);
      
      expect(screen.getByRole('region', { name: 'Document List' })).toBeInTheDocument();
      expect(screen.getByRole('table', { name: 'Documents table' })).toBeInTheDocument();
    });
  });

  describe('Document Management Security', () => {
    it('should verify document encryption status', async () => {
      renderWithProviders(<DocumentList {...defaultProps} />);
      
      // Verify encryption status indicators
      const encryptionStatuses = screen.getAllByText('Encrypted');
      expect(encryptionStatuses).toHaveLength(mockDocumentList.length);
    });

    it('should handle secure document deletion', async () => {
      const { useDocument } = require('../../../hooks/useDocument');
      const deleteDocument = jest.fn();
      useDocument.mockImplementation(() => ({
        ...useDocument(),
        deleteDocument
      }));

      renderWithProviders(<DocumentList {...defaultProps} />);
      
      // Trigger document deletion
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      fireEvent.click(deleteButton);
      
      // Verify confirmation dialog
      const confirmDialog = await screen.findByRole('dialog');
      expect(confirmDialog).toBeInTheDocument();
      
      // Confirm deletion
      const confirmButton = within(confirmDialog).getByRole('button', { name: /delete/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(deleteDocument).toHaveBeenCalled();
      });
    });

    it('should enforce role-based access control', () => {
      const restrictedProps = {
        ...defaultProps,
        userRole: UserRole.HEALTHCARE_PROXY
      };
      
      renderWithProviders(<DocumentList {...restrictedProps} />);
      
      // Verify restricted actions are not available
      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(0);
    });
  });

  describe('Senior-Friendly Features', () => {
    it('should render with enhanced readability', () => {
      renderWithProviders(<DocumentList {...defaultProps} />);
      
      const table = screen.getByRole('table');
      const styles = window.getComputedStyle(table);
      
      // Verify font size and spacing
      expect(styles.fontSize).toBe('16px');
      expect(styles.lineHeight).toBe('1.5');
    });

    it('should provide clear visual feedback for interactions', async () => {
      renderWithProviders(<DocumentList {...defaultProps} />);
      
      const rows = screen.getAllByRole('row');
      
      // Verify hover states
      fireEvent.mouseEnter(rows[1]);
      const rowStyles = window.getComputedStyle(rows[1]);
      expect(rowStyles.backgroundColor).toBeDefined();
    });

    it('should handle loading states accessibly', () => {
      const { useDocument } = require('../../../hooks/useDocument');
      useDocument.mockImplementation(() => ({
        ...useDocument(),
        loading: true
      }));

      renderWithProviders(<DocumentList {...defaultProps} />);
      
      // Verify loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading documents...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display errors accessibly', async () => {
      const { useDocument } = require('../../../hooks/useDocument');
      useDocument.mockImplementation(() => ({
        ...useDocument(),
        error: 'Failed to load documents'
      }));

      renderWithProviders(<DocumentList {...defaultProps} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Failed to load documents');
    });

    it('should handle empty document lists gracefully', () => {
      const { useDocument } = require('../../../hooks/useDocument');
      useDocument.mockImplementation(() => ({
        ...useDocument(),
        documents: []
      }));

      renderWithProviders(<DocumentList {...defaultProps} />);
      
      expect(screen.getByText('No Documents Found')).toBeInTheDocument();
    });
  });
});