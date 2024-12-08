/**
 * Estate Kit - Documents Page Component
 * 
 * Requirements addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Provides a user interface for managing documents, including listing, uploading, and updating document data.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and functionality for document management pages.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Adheres to WCAG 2.1 Level AA standards for accessible document management interfaces.
 * 
 * Human Tasks:
 * 1. Verify document list pagination configuration matches UX requirements
 * 2. Test document upload functionality with various file types and sizes
 * 3. Validate accessibility features with screen readers
 * 4. Review loading state indicators with design team
 */

import React, { useEffect } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

// Internal component imports
import DocumentList from '../../components/documents/DocumentList/DocumentList';
import DocumentUpload from '../../components/documents/DocumentUpload/DocumentUpload';
import Loading from '../../components/common/Loading/Loading';

// Redux and hooks
import { useDocument } from '../../hooks/useDocument';
import { actions } from '../../redux/slices/documentSlice';

/**
 * DocumentsPage component that integrates document listing and upload functionality
 * Implements the Document Management requirement
 */
const DocumentsPage: React.FC = () => {
  // Use the document hook to fetch and manage document data
  const {
    documents,
    loading,
    error,
    fetchAllDocuments
  } = useDocument();

  // Fetch documents on component mount
  useEffect(() => {
    fetchAllDocuments();
  }, [fetchAllDocuments]);

  // Render loading state
  if (loading) {
    return <Loading isVisible={true} />;
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box
          role="alert"
          sx={{
            p: 3,
            mt: 3,
            backgroundColor: 'error.light',
            borderRadius: 1
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Documents
          </Typography>
          <Typography color="error.dark">
            {error instanceof Error ? error.message : 'An error occurred while loading documents'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Page Header */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ mb: 4 }}
          aria-label="Documents Management"
        >
          Documents
        </Typography>

        {/* Document Upload Section */}
        <Paper
          elevation={2}
          sx={{ mb: 4, p: 3 }}
          aria-label="Document Upload Section"
        >
          <Typography variant="h5" gutterBottom>
            Upload Documents
          </Typography>
          <DocumentUpload />
        </Paper>

        {/* Document List Section */}
        <Paper
          elevation={2}
          sx={{ p: 3 }}
          aria-label="Document List Section"
        >
          <Typography variant="h5" gutterBottom>
            Your Documents
          </Typography>
          <DocumentList />
        </Paper>
      </Box>
    </Container>
  );
};

export default DocumentsPage;