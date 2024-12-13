/**
 * Enhanced Document Management Page Component
 * Version: 1.0.0
 * 
 * Implements comprehensive document management interface with:
 * - WCAG 2.1 Level AA compliance
 * - Senior-friendly accessibility features
 * - PIPEDA-compliant security monitoring
 * - Real-time encryption verification
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Container, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';

// Internal components
import { DocumentList } from '../../components/documents/DocumentList/DocumentList';
import { DocumentUpload } from '../../components/documents/DocumentUpload/DocumentUpload';
import { useDocument } from '../../hooks/useDocument';

// Types
import { DocumentType, Document } from '../../types/document.types';
import { UserRole } from '../../types/user.types';

// Interface for tab panel props
interface DocumentTabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
  ariaLabel: string;
}

/**
 * Enhanced tab panel component with accessibility features
 */
const TabPanel: React.FC<DocumentTabPanelProps> = ({
  children,
  value,
  index,
  ariaLabel,
}) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`document-tabpanel-${index}`}
    aria-labelledby={`document-tab-${index}`}
    aria-label={ariaLabel}
  >
    {value === index && (
      <Box sx={{ pt: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

/**
 * Main document management page component
 * Implements comprehensive document handling with security and accessibility
 */
export const Documents: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [selectedType, setSelectedType] = useState<DocumentType | undefined>();
  const { enqueueSnackbar } = useSnackbar();

  // Custom hook for document operations
  const {
    documents,
    loading,
    error,
    uploadProgress,
    encryptionStatus,
    uploadDocument,
    deleteDocument,
    refreshDocuments,
    verifyDocumentEncryption
  } = useDocument(selectedType);

  // Effect for error handling
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error.message, {
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    }
  }, [error, enqueueSnackbar]);

  /**
   * Handles tab changes with accessibility announcements
   */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Update aria-live region for screen readers
    const announcer = document.getElementById('tab-change-announcer');
    if (announcer) {
      announcer.textContent = `Switched to ${newValue === 0 ? 'document list' : 'upload'} tab`;
    }
  };

  /**
   * Handles successful document upload with security verification
   */
  const handleUploadComplete = async (document: Document) => {
    try {
      // Verify encryption status
      const isEncrypted = await verifyDocumentEncryption(document.id);
      if (!isEncrypted) {
        enqueueSnackbar('Document encryption verification failed', { variant: 'error' });
        return;
      }

      enqueueSnackbar('Document uploaded successfully', { variant: 'success' });
      refreshDocuments();
    } catch (error) {
      enqueueSnackbar('Error verifying document security', { variant: 'error' });
    }
  };

  /**
   * Handles document deletion with security checks
   */
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      enqueueSnackbar('Document deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error deleting document', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 4, fontSize: '2rem' }}
      >
        Document Management
      </Typography>

      {/* Accessible tab navigation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="Document management tabs"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { fontSize: '1.1rem' }
        }}
      >
        <Tab 
          label="My Documents" 
          id="document-tab-0"
          aria-controls="document-tabpanel-0"
        />
        <Tab 
          label="Upload Documents" 
          id="document-tab-1"
          aria-controls="document-tabpanel-1"
        />
      </Tabs>

      {/* Document list panel */}
      <TabPanel 
        value={activeTab} 
        index={0}
        ariaLabel="Document list section"
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <DocumentList
            type={selectedType}
            userRole={UserRole.OWNER}
            encryptionRequired={true}
            className="document-list"
            testId="document-list"
          />
        )}
      </TabPanel>

      {/* Document upload panel */}
      <TabPanel 
        value={activeTab} 
        index={1}
        ariaLabel="Document upload section"
      >
        <DocumentUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={(error) => enqueueSnackbar(error, { variant: 'error' })}
          maxFileSize={100 * 1024 * 1024} // 100MB
          allowedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
        />
      </TabPanel>

      {/* Hidden announcer for screen readers */}
      <div
        id="tab-change-announcer"
        role="status"
        aria-live="polite"
        className="visually-hidden"
      />

      <style jsx>{`
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </Container>
  );
};

export default Documents;