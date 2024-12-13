import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { DocumentCard, DocumentCardProps } from './DocumentCard';
import { renderWithProviders } from '../../../utils/test.util';
import { Document, DocumentType, DocumentStatus } from '../../../types/document.types';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock document data
const mockDocument: Document = {
  id: 'test-doc-1',
  title: 'Test Document',
  type: DocumentType.LEGAL,
  status: DocumentStatus.COMPLETED,
  metadata: {
    fileName: 'test-document.pdf',
    fileSize: 1024 * 1024, // 1MB
    mimeType: 'application/pdf',
    uploadedAt: new Date('2024-02-15T12:00:00Z'),
    lastModified: new Date('2024-02-15T12:00:00Z'),
    encryptionStatus: true,
    checksumSHA256: 'abc123',
    storageLocation: 's3://bucket/test-doc',
    retentionPeriod: 365
  }
};

// Mock handlers
const mockHandlers = {
  onDelete: vi.fn(),
  onDownload: vi.fn()
};

describe('DocumentCard', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render document information correctly', () => {
    renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDelete={mockHandlers.onDelete}
        onDownload={mockHandlers.onDownload}
      />
    );

    // Verify title and type display
    expect(screen.getByText(mockDocument.title)).toBeInTheDocument();
    expect(screen.getByText(`Type: ${mockDocument.type}`)).toBeInTheDocument();

    // Verify metadata display
    expect(screen.getByText(`File: ${mockDocument.metadata.fileName}`)).toBeInTheDocument();
    expect(screen.getByText(/Size: 1.00 MB/)).toBeInTheDocument();
    expect(screen.getByText(/Last Modified:/)).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByLabelText('Download document')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete document')).toBeInTheDocument();
  });

  it('should handle document download correctly', async () => {
    renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDownload={mockHandlers.onDownload}
      />
    );

    // Click download button
    const downloadButton = screen.getByLabelText('Download document');
    await userEvent.click(downloadButton);

    // Verify download handler was called
    expect(mockHandlers.onDownload).toHaveBeenCalledWith(mockDocument.id);
    expect(mockHandlers.onDownload).toHaveBeenCalledTimes(1);
  });

  it('should handle document deletion with confirmation', async () => {
    renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDelete={mockHandlers.onDelete}
      />
    );

    // Click delete button
    const deleteButton = screen.getByLabelText('Delete document');
    await userEvent.click(deleteButton);

    // Verify confirmation dialog appears
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = within(dialog).getByText('Delete');
    await userEvent.click(confirmButton);

    // Verify delete handler was called
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockDocument.id);
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should cancel deletion when Cancel is clicked', async () => {
    renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDelete={mockHandlers.onDelete}
      />
    );

    // Open delete dialog
    await userEvent.click(screen.getByLabelText('Delete document'));
    
    // Click cancel
    await userEvent.click(screen.getByText('Cancel'));

    // Verify dialog is closed and delete was not called
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockHandlers.onDelete).not.toHaveBeenCalled();
  });

  it('should handle loading states during actions', async () => {
    const slowDelete = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDelete={slowDelete}
      />
    );

    // Start delete operation
    await userEvent.click(screen.getByLabelText('Delete document'));
    await userEvent.click(screen.getByText('Delete'));

    // Verify loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();

    // Wait for operation to complete
    await waitFor(() => {
      expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
    });
  });

  it('should display error messages when operations fail', async () => {
    const failingDelete = vi.fn().mockRejectedValue(new Error('Delete failed'));
    
    renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDelete={failingDelete}
      />
    );

    // Attempt delete
    await userEvent.click(screen.getByLabelText('Delete document'));
    await userEvent.click(screen.getByText('Delete'));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Failed to delete document. Please try again.')).toBeInTheDocument();
    });
  });

  it('should meet accessibility requirements', async () => {
    const { container } = renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDelete={mockHandlers.onDelete}
        onDownload={mockHandlers.onDownload}
      />
    );

    // Run accessibility audit
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Verify keyboard navigation
    const card = screen.getByTestId(`document-card-${mockDocument.id}`);
    expect(card).toHaveAttribute('role', 'region');

    // Verify ARIA labels
    expect(screen.getByLabelText('Download document')).toHaveAttribute('aria-label', 'Download document');
    expect(screen.getByLabelText('Delete document')).toHaveAttribute('aria-label', 'Delete document');

    // Verify dialog accessibility
    await userEvent.click(screen.getByLabelText('Delete document'));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'delete-dialog-description');
  });

  it('should handle keyboard interactions correctly', async () => {
    renderWithProviders(
      <DocumentCard 
        document={mockDocument}
        onDelete={mockHandlers.onDelete}
        onDownload={mockHandlers.onDownload}
      />
    );

    // Test keyboard navigation
    const downloadButton = screen.getByLabelText('Download document');
    const deleteButton = screen.getByLabelText('Delete document');

    // Tab navigation
    await userEvent.tab();
    expect(downloadButton).toHaveFocus();

    await userEvent.tab();
    expect(deleteButton).toHaveFocus();

    // Enter key interaction
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Dialog keyboard interaction
    await userEvent.tab(); // Focus Cancel
    await userEvent.tab(); // Focus Delete
    await userEvent.keyboard('{Enter}'); // Confirm delete
    
    expect(mockHandlers.onDelete).toHaveBeenCalled();
  });
});