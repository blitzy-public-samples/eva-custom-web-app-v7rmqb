// @package pdf-lib v1.17.1
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
// @package aws-sdk v2.1360.0
import { S3 } from 'aws-sdk';

// Import internal utilities and types
import { validateDocument } from './validation.util';
import { encryptData } from './encryption.util';
import { initializeS3 } from '../config/aws';
import { DocumentTypes } from '../types/document.types';

/**
 * Human Tasks:
 * 1. Configure AWS S3 bucket permissions for PDF storage
 * 2. Set up appropriate CORS policies for S3 bucket
 * 3. Verify PDF template designs match business requirements
 * 4. Ensure encryption keys are properly configured in environment
 */

/**
 * Generates a PDF document based on the provided document data.
 * 
 * Requirement: PDF Generation and Formatting
 * Location: Technical Specifications/1.3 Scope/In-Scope/Core Features
 * Description: Implements utilities for generating and formatting PDF documents for estate planning.
 * 
 * @param documentData - The document data used to generate the PDF
 * @returns A Buffer containing the generated PDF document
 * @throws Error if document validation fails or PDF generation encounters an error
 */
export async function generatePDF(documentData: DocumentTypes): Promise<Buffer> {
  try {
    // Validate document data before processing
    if (!validateDocument(documentData)) {
      throw new Error('Invalid document data provided');
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a new page to the document
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Embed the standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    // Add document title
    page.drawText(documentData.title, {
      x: 50,
      y: height - 50,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });

    // Add document category
    page.drawText(`Category: ${documentData.category}`, {
      x: 50,
      y: height - 100,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Add metadata information
    const metadataY = height - 150;
    Object.entries(documentData.metadata).forEach(([key, value], index) => {
      page.drawText(`${key}: ${value}`, {
        x: 50,
        y: metadataY - (index * 20),
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });

    // Set PDF metadata
    pdfDoc.setTitle(documentData.title);
    pdfDoc.setCreator('Estate Kit');
    pdfDoc.setProducer('Estate Kit PDF Generator');
    pdfDoc.setCreationDate(new Date());

    // Convert PDF to buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF generation';
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  }
}

/**
 * Stores the generated PDF document in AWS S3.
 * 
 * Requirement: Document Storage
 * Location: Technical Specifications/2.2 Container Architecture/Backend Services
 * Description: Integrates with AWS S3 for storing generated PDF documents securely.
 * 
 * Requirement: Data Security
 * Location: Technical Specifications/1.3 Scope/In-Scope/Data Security
 * Description: Ensures secure handling of sensitive document data during storage.
 * 
 * @param pdfBuffer - The PDF document as a binary buffer
 * @param documentId - The unique identifier for the document
 * @returns The URL of the stored PDF document in S3
 * @throws Error if storage operation fails
 */
export async function storePDF(pdfBuffer: Buffer, documentId: string): Promise<string> {
  try {
    // Initialize S3 client
    const s3Client: S3 = initializeS3();

    // Encrypt the PDF buffer before storage
    const encryptedBuffer = encryptData(pdfBuffer.toString('base64'), process.env.ENCRYPTION_KEY!);

    // Set up S3 upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `documents/${documentId}.pdf`,
      Body: Buffer.from(encryptedBuffer, 'base64'),
      ContentType: 'application/pdf',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'document-id': documentId,
        'encryption-version': '1.0',
        'timestamp': new Date().toISOString()
      }
    };

    // Upload to S3
    const uploadResult = await s3Client.upload(uploadParams).promise();

    // Return the S3 URL
    return uploadResult.Location;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF storage';
    throw new Error(`Failed to store PDF: ${errorMessage}`);
  }
}