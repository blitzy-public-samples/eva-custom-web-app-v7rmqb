// @package sequelize v6.31.0
// @package aws-sdk v2.1360.0
// @package pdf-lib v1.17.1

import { DocumentModel, validateDocumentData } from '../db/models/document.model';
import { generatePDF, storePDF } from '../utils/pdf.util';
import { uploadDocument, downloadDocument } from '../integrations/aws-s3.integration';
import { validateDocument } from '../utils/validation.util';
import { DocumentTypes } from '../types/document.types';
import { logInfo, logError } from '../utils/logger.util';

/**
 * Human Tasks:
 * 1. Ensure AWS S3 bucket is properly configured with appropriate permissions
 * 2. Verify PDF template designs match business requirements
 * 3. Configure document size limits and storage quotas
 * 4. Set up document backup and retention policies
 * 5. Review encryption key management for document storage
 */

/**
 * Creates a new document in the database and optionally generates a PDF.
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - PDF Generation and Formatting (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Document Storage (Technical Specifications/2.2 Container Architecture/Backend Services)
 * 
 * @param documentData - The document data to create
 * @returns The created document instance
 */
export const createDocument = async (documentData: DocumentTypes): Promise<DocumentModel> => {
  try {
    // Validate document data
    if (!validateDocument(documentData)) {
      throw new Error('Invalid document data provided');
    }

    // Additional model-specific validation
    validateDocumentData(documentData);

    // Create document record in database
    const document = await DocumentModel.create(documentData);

    // Generate PDF if required
    if (documentData.metadata.generatePdf) {
      const pdfBuffer = await generatePDF(documentData);
      
      // Store PDF in S3
      const pdfUrl = await storePDF(pdfBuffer, document.documentId);
      
      // Update document with PDF URL
      await document.update({
        metadata: {
          ...document.metadata,
          pdfUrl
        }
      });
    }

    logInfo(`Document created successfully: ${document.documentId}`);
    return document;

  } catch (error) {
    logError(error as Error);
    throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Retrieves a document from the database by its ID.
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 * 
 * @param documentId - The ID of the document to retrieve
 * @returns The retrieved document instance
 */
export const getDocument = async (documentId: string): Promise<DocumentModel> => {
  try {
    const document = await DocumentModel.findByPk(documentId);
    
    if (!document) {
      throw new Error(`Document not found with ID: ${documentId}`);
    }

    // If document has a PDF, download it from S3
    if (document.metadata.pdfUrl) {
      const pdfBuffer = await downloadDocument(`documents/${documentId}.pdf`);
      document.metadata.pdfBuffer = pdfBuffer;
    }

    logInfo(`Document retrieved successfully: ${documentId}`);
    return document;

  } catch (error) {
    logError(error as Error);
    throw new Error(`Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Updates an existing document in the database.
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 * 
 * @param documentId - The ID of the document to update
 * @param updateData - The data to update
 * @returns True if the update was successful
 */
export const updateDocument = async (
  documentId: string,
  updateData: Partial<DocumentTypes>
): Promise<boolean> => {
  try {
    // Validate update data
    if (!validateDocument({ ...updateData, documentId } as DocumentTypes)) {
      throw new Error('Invalid update data provided');
    }

    const document = await DocumentModel.findByPk(documentId);
    
    if (!document) {
      throw new Error(`Document not found with ID: ${documentId}`);
    }

    // Update document record
    await document.update(updateData);

    // Regenerate PDF if required
    if (updateData.metadata?.regeneratePdf) {
      const pdfBuffer = await generatePDF({ ...document.toJSON(), ...updateData });
      const pdfUrl = await storePDF(pdfBuffer, documentId);
      
      await document.update({
        metadata: {
          ...document.metadata,
          pdfUrl
        }
      });
    }

    logInfo(`Document updated successfully: ${documentId}`);
    return true;

  } catch (error) {
    logError(error as Error);
    throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Deletes a document from the database and AWS S3.
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 * - Document Storage (Technical Specifications/2.2 Container Architecture/Backend Services)
 * 
 * @param documentId - The ID of the document to delete
 * @returns True if the deletion was successful
 */
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    const document = await DocumentModel.findByPk(documentId);
    
    if (!document) {
      throw new Error(`Document not found with ID: ${documentId}`);
    }

    // Delete PDF from S3 if it exists
    if (document.metadata.pdfUrl) {
      await uploadDocument.deleteDocument(`documents/${documentId}.pdf`);
    }

    // Delete document record
    await document.destroy();

    logInfo(`Document deleted successfully: ${documentId}`);
    return true;

  } catch (error) {
    logError(error as Error);
    throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};