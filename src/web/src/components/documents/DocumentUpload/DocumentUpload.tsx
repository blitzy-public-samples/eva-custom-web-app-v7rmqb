/**
 * Estate Kit - Document Upload Component
 * 
 * Requirements addressed:
 * - Document Upload Interface (Technical Specifications/3.1 User Interface Design/Document Upload Interface)
 *   Implements a user-friendly file upload interface with drag-and-drop support and validation.
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Provides the frontend logic for uploading documents, including validation and API integration.
 * 
 * Human Tasks:
 * 1. Verify file size limits match backend configuration
 * 2. Test drag-and-drop functionality across different browsers
 * 3. Confirm supported file types with backend team
 * 4. Review document validation rules with content team
 */

// React v18.2.0
import React, { useState, useCallback } from 'react';
// Material UI v5.11.0
import { 
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';

// Internal imports
import { validateDocument } from '../../utils/validation.util';
import { formatDocumentTitle } from '../../utils/format.util';
import { uploadDocument } from '../../services/document.service';
import { FileUpload } from '../common/FileUpload/FileUpload';
import { theme } from '../../config/theme.config';
import { DocumentTypes } from '../../types/document.types';

interface DocumentUploadState {
  uploadedDocuments: DocumentTypes[];
  isUploading: boolean;
  error: string | null;
}

/**
 * DocumentUpload Component
 * Provides a user interface for uploading documents with validation and API integration
 */
export class DocumentUpload extends React.Component<{}, DocumentUploadState> {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ACCEPTED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  constructor(props: {}) {
    super(props);
    this.state = {
      uploadedDocuments: [],
      isUploading: false,
      error: null
    };

    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.renderDragAndDropArea = this.renderDragAndDropArea.bind(this);
  }

  /**
   * Handles the file upload process, including validation and API interaction
   * Implements Document Management requirement
   */
  private async handleFileUpload(files: File[]): Promise<void> {
    this.setState({ isUploading: true, error: null });

    try {
      const uploadedDocs: DocumentTypes[] = [];

      for (const file of files) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', formatDocumentTitle(file.name));
        formData.append('category', this.getDocumentCategory(file.type));

        // Upload document to backend
        const uploadedDoc = await uploadDocument(formData);

        // Validate uploaded document
        if (!validateDocument(uploadedDoc)) {
          throw new Error(`Invalid document data received for ${file.name}`);
        }

        uploadedDocs.push(uploadedDoc);
      }

      this.setState(prevState => ({
        uploadedDocuments: [...prevState.uploadedDocuments, ...uploadedDocs],
        isUploading: false
      }));
    } catch (error) {
      this.setState({
        isUploading: false,
        error: error instanceof Error ? error.message : 'An error occurred during upload'
      });
    }
  }

  /**
   * Determines document category based on file type
   */
  private getDocumentCategory(fileType: string): string {
    if (fileType.includes('image')) return 'PERSONAL';
    if (fileType.includes('pdf')) return 'LEGAL';
    if (fileType.includes('word')) return 'LEGAL';
    return 'PERSONAL';
  }

  /**
   * Renders the drag-and-drop area using the FileUpload component
   * Implements Document Upload Interface requirement
   */
  private renderDragAndDropArea(): JSX.Element {
    const { palette, shape } = theme;
    const { isUploading, error, uploadedDocuments } = this.state;

    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 800,
          margin: '0 auto',
          padding: 3
        }}
      >
        <Typography variant="h5" gutterBottom>
          Upload Documents
        </Typography>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Upload your important documents securely. We support PDF, Word, and image files.
        </Typography>

        <FileUpload
          onUploadComplete={this.handleFileUpload}
          maxFiles={5}
          acceptedFileTypes={this.ACCEPTED_FILE_TYPES}
          maxFileSize={this.MAX_FILE_SIZE}
        />

        {isUploading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {uploadedDocuments.length > 0 && (
          <Paper 
            elevation={2}
            sx={{ 
              mt: 3,
              p: 2,
              borderRadius: shape.borderRadius,
              backgroundColor: palette.background.paper
            }}
          >
            <Typography variant="h6" gutterBottom>
              Uploaded Documents
            </Typography>
            {uploadedDocuments.map((doc, index) => (
              <Box
                key={doc.documentId}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: index < uploadedDocuments.length - 1 ? 
                    `1px solid ${palette.divider}` : 'none'
                }}
              >
                <Typography variant="body2">
                  {doc.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {doc.category}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    );
  }

  render(): JSX.Element {
    return this.renderDragAndDropArea();
  }
}

export default DocumentUpload;