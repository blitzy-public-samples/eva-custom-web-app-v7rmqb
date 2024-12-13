import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import DocumentCard from '../DocumentCard/DocumentCard';
import Table from '../../common/Table/Table';
import Loading from '../../common/Loading/Loading';
import { Document, DocumentType } from '../../../types/document.types';
import { UserRole } from '../../../types/auth.types';
import DocumentService from '../../../services/document.service';

/**
 * Props interface for DocumentList component with enhanced security and accessibility features
 */
export interface DocumentListProps {
  /** Optional document type filter */
  type?: DocumentType;
  /** Optional CSS class name */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
  /** User role for access control */
  userRole: UserRole;
  /** Flag indicating if encryption is required */
  encryptionRequired: boolean;
}

/**
 * Column configuration for document table
 */
const columns = [
  { id: 'title', label: 'Document Title', sortable: true },
  { id: 'type', label: 'Type', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'lastModified', label: 'Last Modified', sortable: true },
  { id: 'encryption', label: 'Encryption Status', sortable: false },
];

/**
 * Enhanced DocumentList component implementing comprehensive document management
 * with security features and senior-friendly accessibility.
 *
 * @version 1.0.0
 */
export const DocumentList: React.FC<DocumentListProps> = ({
  type,
  className,
  testId = 'document-list',
  userRole,
  encryptionRequired,
}) => {
  // State management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches documents with security context and error handling
   */
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await DocumentService.getDocuments({
        type,
        userRole,
        encryptionRequired,
      });

      // Verify document encryption status
      const verifiedDocuments = response.filter((doc: Document) => 
        !encryptionRequired || doc.metadata.encryptionStatus
      );

      setDocuments(verifiedDocuments);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError('Unable to load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [type, userRole, encryptionRequired]);

  /**
   * Handles secure document deletion with audit logging
   */
  const handleDelete = useCallback(async (documentId: string) => {
    try {
      setError(null);
      await DocumentService.secureDeleteDocument(documentId);
      
      // Update document list after successful deletion
      setDocuments(prevDocs => 
        prevDocs.filter(doc => doc.id !== documentId)
      );
    } catch (error) {
      console.error('Document deletion failed:', error);
      setError('Failed to delete document. Please try again.');
    }
  }, []);

  /**
   * Handles secure document sorting with performance monitoring
   */
  const handleSort = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    setDocuments(prevDocs => {
      const sortedDocs = [...prevDocs].sort((a, b) => {
        const aValue = a[columnId as keyof Document];
        const bValue = b[columnId as keyof Document];
        
        if (direction === 'asc') {
          return String(aValue).localeCompare(String(bValue));
        }
        return String(bValue).localeCompare(String(aValue));
      });

      return sortedDocs;
    });
  }, []);

  // Initial document fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /**
   * Formats documents for table display
   */
  const formatDocumentsForTable = useCallback((docs: Document[]) => {
    return docs.map(doc => ({
      title: doc.title,
      type: doc.type,
      status: doc.status,
      lastModified: new Date(doc.metadata.lastModified).toLocaleDateString(),
      encryption: doc.metadata.encryptionStatus ? 'Encrypted' : 'Not Encrypted',
    }));
  }, []);

  /**
   * Renders error message with accessibility features
   */
  const renderError = () => {
    if (!error) return null;

    return (
      <Alert 
        severity="error"
        sx={{ mb: 2 }}
        role="alert"
        aria-live="polite"
      >
        {error}
      </Alert>
    );
  };

  /**
   * Renders loading state with accessibility features
   */
  const renderLoading = () => {
    if (!loading) return null;

    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        p={4}
        role="status"
        aria-live="polite"
      >
        <Loading 
          size="large"
          label="Loading documents..."
          color="primary"
        />
      </Box>
    );
  };

  /**
   * Renders empty state with accessibility features
   */
  const renderEmptyState = () => {
    if (loading || documents.length > 0) return null;

    return (
      <Box 
        textAlign="center" 
        p={4}
        role="status"
        aria-live="polite"
      >
        <Typography variant="h6" gutterBottom>
          No Documents Found
        </Typography>
        <Typography color="textSecondary">
          {type 
            ? `No ${type.toLowerCase()} documents are available.`
            : 'No documents are available.'
          }
        </Typography>
      </Box>
    );
  };

  return (
    <Box 
      className={className}
      data-testid={testId}
      role="region"
      aria-label="Document List"
    >
      {renderError()}
      {renderLoading()}
      {renderEmptyState()}

      {!loading && documents.length > 0 && (
        <Table
          columns={columns}
          data={formatDocumentsForTable(documents)}
          sortable={true}
          pagination={true}
          onSort={handleSort}
          ariaLabel="Documents table"
          highContrast={true}
        />
      )}

      {/* Document cards for mobile view */}
      <Box 
        sx={{ 
          display: { xs: 'block', md: 'none' },
          mt: 2 
        }}
      >
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDelete={handleDelete}
            className="mb-2"
            ariaLabel={`Document: ${doc.title}`}
          />
        ))}
      </Box>
    </Box>
  );
};

export default DocumentList;