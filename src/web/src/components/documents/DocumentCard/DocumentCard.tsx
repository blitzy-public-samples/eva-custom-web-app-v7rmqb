import React, { useCallback, useState } from 'react';
import { IconButton, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { Card } from '../../common/Card/Card';
import { Document } from '../../../types/document.types';
import DocumentService from '../../../services/document.service';

/**
 * Props interface for DocumentCard component with enhanced accessibility and security features
 */
export interface DocumentCardProps {
  /** Document object containing all document information */
  document: Document;
  /** Optional callback for document deletion */
  onDelete?: (documentId: string) => Promise<void>;
  /** Optional callback for document download */
  onDownload?: (documentId: string) => Promise<void>;
  /** Optional CSS class name */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/**
 * A senior-friendly card component for displaying document information with enhanced
 * accessibility and security features. Implements WCAG 2.1 Level AA compliance.
 *
 * @version 1.0.0
 */
export const DocumentCard: React.FC<DocumentCardProps> = React.memo(({
  document,
  onDelete,
  onDownload,
  className,
  ariaLabel
}) => {
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // State for operation loading
  const [isLoading, setIsLoading] = useState(false);
  // State for error handling
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles document deletion with confirmation and security measures
   */
  const handleDelete = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call service method for secure deletion
      await DocumentService.secureDeleteDocument(document.id);
      
      // Call parent callback if provided
      if (onDelete) {
        await onDelete(document.id);
      }

      setIsDeleteDialogOpen(false);
    } catch (error) {
      setError('Failed to delete document. Please try again.');
      console.error('Document deletion failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [document.id, onDelete]);

  /**
   * Handles secure document download with proper error handling
   */
  const handleDownload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call service method for secure download
      await DocumentService.downloadDocument(document.id);
      
      // Call parent callback if provided
      if (onDownload) {
        await onDownload(document.id);
      }
    } catch (error) {
      setError('Failed to download document. Please try again.');
      console.error('Document download failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [document.id, onDownload]);

  /**
   * Renders document metadata in an accessible format
   */
  const renderMetadata = () => (
    <div className="document-metadata">
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: '1rem', mb: 1 }}
      >
        File: {document.metadata.fileName}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: '1rem', mb: 1 }}
      >
        Size: {(document.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: '1rem' }}
      >
        Last Modified: {format(new Date(document.metadata.lastModified), 'PPP')}
      </Typography>
    </div>
  );

  // Action buttons with proper accessibility attributes
  const actions = [
    <IconButton
      key="download"
      onClick={handleDownload}
      disabled={isLoading}
      aria-label="Download document"
      color="primary"
      size="large"
    >
      <DownloadIcon />
    </IconButton>,
    <IconButton
      key="delete"
      onClick={() => setIsDeleteDialogOpen(true)}
      disabled={isLoading}
      aria-label="Delete document"
      color="error"
      size="large"
    >
      <DeleteIcon />
    </IconButton>
  ];

  return (
    <>
      <Card
        title={document.title}
        subtitle={`Type: ${document.type}`}
        className={className}
        ariaLabel={ariaLabel || `Document: ${document.title}`}
        elevation={2}
        actions={actions}
        testId={`document-card-${document.id}`}
      >
        {renderMetadata()}
        
        {/* Error message display with proper accessibility */}
        {error && (
          <Typography
            color="error"
            role="alert"
            sx={{ mt: 2 }}
          >
            {error}
          </Typography>
        )}
      </Card>

      {/* Accessible delete confirmation dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Document Deletion
        </DialogTitle>
        <DialogContent id="delete-dialog-description">
          <Typography>
            Are you sure you want to delete "{document.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isLoading}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            color="error"
            variant="contained"
            autoFocus
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

DocumentCard.displayName = 'DocumentCard';

export default DocumentCard;