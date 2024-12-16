/**
 * @fileoverview Enhanced document upload component with senior-friendly interface
 * Implements WCAG 2.1 Level AA compliance with comprehensive security features
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { styled } from '@mui/material/styles';
import { 
  Select,
  Typography,
  Box,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { FileUpload } from '../../common/FileUpload/FileUpload';
import { DocumentType } from '../../../types/document.types';
import DocumentService from '../../../services/document.service';

// Styled components for enhanced accessibility
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  minWidth: 200,
  '& label': {
    fontSize: '1.1rem',
    color: theme.palette.text.primary,
  },
  '& .MuiSelect-select': {
    fontSize: '1.1rem',
    padding: theme.spacing(1.5),
  },
}));

const UploadContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  maxWidth: 800,
  margin: '0 auto',
}));

// Interface definitions
export interface DocumentUploadProps {
  onUploadComplete: (document: any) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  retryAttempts?: number;
}

/**
 * Enhanced document upload component with senior-friendly interface
 * Implements drag-and-drop, progress tracking, and accessibility features
 */
export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  retryAttempts = 3
}) => {
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const announcerRef = useRef<HTMLDivElement>(null);

  // Handle document type selection with accessibility
  const handleDocumentTypeChange = useCallback((
    event: SelectChangeEvent<DocumentType>
  ) => {
    const value = event.target.value as DocumentType;
    setSelectedType(value);
    setError(null);
    
    // Announce selection for screen readers
    const announcement = `Selected document type: ${value.toLowerCase().replace('_', ' ')}`;
    window.setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = announcement;
      }
    }, 100);
  }, []);

  // Enhanced file upload handler with security and progress tracking
  const handleUpload = useCallback(async (file: File) => {
    if (!selectedType) {
      setError('Please select a document type before uploading');
      onUploadError('Document type not selected');
      return;
    }

    setIsUploading(true);
    setError(null);
    let currentAttempt = 0;

    const uploadWithRetry = async (): Promise<void> => {
      try {
        const uploadRequest = {
          title: file.name,
          type: selectedType,
          file,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            checksumSHA256: await calculateChecksum(file),
            encryptionStatus: true,
            storageLocation: 'S3',
            retentionPeriod: 2555 // 7 years in days
          },
          accessControl: {
            delegateIds: [],
            accessLevel: 'READ',
            expiresAt: null
          }
        };

        const document = await DocumentService.uploadDocument(
          uploadRequest,
          (progress: number) => {
            setUploadProgress(progress);
            // Update ARIA live region for screen readers
            if (announcerRef.current) {
              announcerRef.current.textContent = `Upload progress: ${progress}%`;
            }
          }
        );

        setIsUploading(false);
        setUploadProgress(0);
        onUploadComplete(document);

        // Success announcement for screen readers
        if (announcerRef.current) {
          announcerRef.current.textContent = `${file.name} uploaded successfully`;
        }
      } catch (error) {
        currentAttempt++;
        if (currentAttempt < retryAttempts) {
          // Exponential backoff retry
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, currentAttempt) * 1000)
          );
          return uploadWithRetry();
        }

        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setError(errorMessage);
        setIsUploading(false);
        onUploadError(errorMessage);
      }
    };

    await uploadWithRetry();
  }, [selectedType, retryAttempts, onUploadComplete, onUploadError]);

  // Calculate file checksum for integrity verification
  const calculateChecksum = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileUploadComplete = useCallback((document: Document) => {
    handleUpload(document as unknown as File);
  }, [handleUpload]);

  return (
    <UploadContainer role="region" aria-label="Document Upload">
      <Typography variant="h5" component="h2" gutterBottom>
        Upload Documents
      </Typography>
      
      <StyledFormControl>
        <InputLabel id="document-type-label">Document Type</InputLabel>
        <Select
          labelId="document-type-label"
          value={selectedType}
          onChange={handleDocumentTypeChange}
          label="Document Type"
          aria-describedby="document-type-helper"
        >
          <MenuItem value={DocumentType.MEDICAL}>Medical Records</MenuItem>
          <MenuItem value={DocumentType.FINANCIAL}>Financial Documents</MenuItem>
          <MenuItem value={DocumentType.LEGAL}>Legal Documents</MenuItem>
          <MenuItem value={DocumentType.PERSONAL}>Personal Documents</MenuItem>
        </Select>
        <Typography id="document-type-helper" variant="caption" color="textSecondary">
          Select the type of document you are uploading
        </Typography>
      </StyledFormControl>

      <FileUpload
        documentType={selectedType as any}
        maxFileSize={maxFileSize}
        acceptedFileTypes={allowedFileTypes}
        ariaLabel="Upload document"
        helpText="Click here or drag and drop your files to upload"
        onUploadComplete={handleFileUploadComplete}
        onUploadError={(error) => {
          setError(error);
          onUploadError(error);
        }}
      />

      {isUploading && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <CircularProgress
            variant="determinate"
            value={uploadProgress}
            size={24}
            sx={{ mr: 1 }}
          />
          <Typography variant="body2" color="textSecondary">
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Hidden announcer for screen readers */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        className="visually-hidden"
      />
    </UploadContainer>
  );
};

export default DocumentUpload;