/**
 * Estate Kit - File Upload Component
 * 
 * Human Tasks:
 * 1. Verify file size limits with backend team
 * 2. Confirm supported file types match backend validation
 * 3. Test drag-and-drop functionality across different browsers
 * 4. Validate accessibility features with screen readers
 */

// React v18.2.0
import React, { useState, useCallback, useRef } from 'react';
// Material UI v5.11.0
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Internal imports
import { validateDocument } from '../../utils/validation.util';
import { formatDocumentTitle } from '../../utils/format.util';
import { theme } from '../../config/theme.config';

// Import styles
import '../../styles/global.css';
import '../../styles/variables.css';

// Types for component props and state
interface FileUploadProps {
  onUploadComplete?: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

interface FileUploadState {
  uploadedFiles: File[];
  isUploading: boolean;
  error: string | null;
  isDragging: boolean;
}

/**
 * FileUpload Component
 * 
 * Requirements addressed:
 * - Document Upload Interface (Technical Specifications/3.1 User Interface Design/Document Upload Interface)
 *   Implements drag-and-drop file upload with validation
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Uses theme configuration for consistent styling
 */
export class FileUpload extends React.Component<FileUploadProps, FileUploadState> {
  private fileInputRef: React.RefObject<HTMLInputElement>;
  private readonly DEFAULT_MAX_FILES = 5;
  private readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_ACCEPTED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  constructor(props: FileUploadProps) {
    super(props);
    this.state = {
      uploadedFiles: [],
      isUploading: false,
      error: null,
      isDragging: false
    };
    this.fileInputRef = React.createRef();
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  /**
   * Handles file upload process including validation and formatting
   */
  private async handleFileUpload(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;

    const maxFiles = this.props.maxFiles || this.DEFAULT_MAX_FILES;
    const maxFileSize = this.props.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;
    const acceptedTypes = this.props.acceptedFileTypes || this.DEFAULT_ACCEPTED_TYPES;

    // Validate total number of files
    if (this.state.uploadedFiles.length + files.length > maxFiles) {
      this.setState({ error: `Maximum ${maxFiles} files allowed` });
      return;
    }

    this.setState({ isUploading: true, error: null });

    try {
      const validatedFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} not supported`);
        }

        // Validate file size
        if (file.size > maxFileSize) {
          throw new Error(`File ${file.name} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`);
        }

        // Create document object for validation
        const document = {
          documentId: crypto.randomUUID(),
          title: file.name,
          category: this.getDocumentCategory(file.type),
          status: 'pending',
          metadata: {
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
          }
        };

        // Validate document structure
        if (!validateDocument(document)) {
          throw new Error(`Invalid document structure for ${file.name}`);
        }

        // Format document title
        const formattedTitle = formatDocumentTitle(document.title);
        const renamedFile = new File([file], formattedTitle, { type: file.type });
        validatedFiles.push(renamedFile);
      }

      this.setState(prevState => ({
        uploadedFiles: [...prevState.uploadedFiles, ...validatedFiles],
        isUploading: false
      }));

      if (this.props.onUploadComplete) {
        this.props.onUploadComplete(validatedFiles);
      }
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

  private handleDragEnter(e: React.DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ isDragging: true });
  }

  private handleDragLeave(e: React.DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ isDragging: false });
  }

  private handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ isDragging: false });
    this.handleFileUpload(e.dataTransfer.files);
  }

  /**
   * Renders the drag-and-drop area
   */
  private renderDragAndDropArea(): JSX.Element {
    const { palette, shape } = theme;
    const { isDragging, isUploading, error } = this.state;

    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          margin: '0 auto'
        }}
      >
        <input
          type="file"
          ref={this.fileInputRef}
          style={{ display: 'none' }}
          multiple
          onChange={(e) => this.handleFileUpload(e.target.files)}
          accept={this.props.acceptedFileTypes?.join(',') || this.DEFAULT_ACCEPTED_TYPES.join(',')}
        />

        <Paper
          elevation={3}
          sx={{
            padding: 4,
            textAlign: 'center',
            backgroundColor: isDragging ? palette.primary.light : palette.background.paper,
            border: `2px dashed ${isDragging ? palette.primary.main : palette.grey[300]}`,
            borderRadius: shape.borderRadius,
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out'
          }}
          onDragEnter={this.handleDragEnter}
          onDragOver={this.handleDragEnter}
          onDragLeave={this.handleDragLeave}
          onDrop={this.handleDrop}
          onClick={() => this.fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload files by clicking or dragging and dropping"
        >
          {isUploading ? (
            <CircularProgress size={48} />
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: palette.primary.main }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Drag and drop files here or click to browse
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Supported formats: PDF, DOCX, JPG, PNG
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Maximum file size: {this.props.maxFileSize ? `${this.props.maxFileSize / 1024 / 1024}MB` : '10MB'}
              </Typography>
            </>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {this.state.uploadedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Uploaded Files:</Typography>
            {this.state.uploadedFiles.map((file, index) => (
              <Typography key={index} variant="body2">
                {file.name} ({(file.size / 1024).toFixed(1)}KB)
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  render(): JSX.Element {
    return this.renderDragAndDropArea();
  }
}

export default FileUpload;