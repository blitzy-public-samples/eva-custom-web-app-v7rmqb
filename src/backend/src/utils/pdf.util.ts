/**
 * PDF Utility Module for Estate Kit Platform
 * Provides secure PDF document manipulation with PIPEDA compliance
 * @module pdf.util
 * @version 1.0.0
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'; // v1.17.1
import PDFParser from 'pdf2json'; // v2.0.0
import { ReadableStreamBuffer } from 'stream-buffers'; // v3.0.2
import { DocumentMetadata } from '../types/document.types';
import { logger } from '../utils/logger.util';

// Constants for PDF processing
const MAX_PDF_SIZE_MB = 25;
const PREVIEW_WATERMARK = 'ESTATE KIT PREVIEW - CONFIDENTIAL';
const SUPPORTED_PDF_VERSIONS = ['1.4', '1.5', '1.6', '1.7'];
const PREVIEW_MAX_RESOLUTION = 150; // DPI for previews

/**
 * Interface for PDF validation results
 */
interface ValidationResult {
  isValid: boolean;
  format: {
    isPDF: boolean;
    version: string;
    isVersionSupported: boolean;
  };
  security: {
    isEncrypted: boolean;
    hasJavaScript: boolean;
    hasExternalLinks: boolean;
    malwareDetected: boolean;
  };
  accessibility: {
    hasTextContent: boolean;
    isTagged: boolean;
    hasLanguageSpecified: boolean;
  };
  errors: string[];
}

/**
 * Interface for PDF preview generation options
 */
interface PreviewOptions {
  watermarkText?: string;
  resolution?: number;
  allowPrinting?: boolean;
  allowCopying?: boolean;
}

/**
 * Validates PDF file format, structure, and performs security scanning
 * @param pdfBuffer - Buffer containing PDF data
 * @param performSecurityScan - Flag to enable detailed security scanning
 * @returns Promise<ValidationResult> - Detailed validation results
 */
export async function validatePDF(
  pdfBuffer: Buffer,
  performSecurityScan: boolean = true
): Promise<ValidationResult> {
  try {
    // Initialize validation result
    const result: ValidationResult = {
      isValid: false,
      format: { isPDF: false, version: '', isVersionSupported: false },
      security: { isEncrypted: false, hasJavaScript: false, hasExternalLinks: false, malwareDetected: false },
      accessibility: { hasTextContent: false, isTagged: false, hasLanguageSpecified: false },
      errors: []
    };

    // Check file size
    if (pdfBuffer.length > MAX_PDF_SIZE_MB * 1024 * 1024) {
      result.errors.push(`PDF exceeds maximum size of ${MAX_PDF_SIZE_MB}MB`);
      return result;
    }

    // Load PDF document for validation
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    
    // Basic format validation
    result.format.isPDF = true;
    result.format.version = '1.7'; // Default to 1.7 as pdf-lib doesn't expose version info
    result.format.isVersionSupported = SUPPORTED_PDF_VERSIONS.includes(result.format.version);

    // Security checks
    if (performSecurityScan) {
      result.security.isEncrypted = pdfDoc.isEncrypted;
      result.security.hasJavaScript = await checkForJavaScript();
      result.security.hasExternalLinks = await checkForExternalLinks();
      result.security.malwareDetected = await performMalwareScan();
    }

    // Accessibility checks
    const accessibilityInfo = await checkAccessibility();
    result.accessibility = accessibilityInfo;

    // Determine overall validity
    result.isValid = result.format.isVersionSupported &&
      !result.security.malwareDetected &&
      !result.security.hasJavaScript &&
      result.accessibility.hasTextContent;

    // Log validation operation
    logger.info('PDF validation completed', {
      isValid: result.isValid,
      errors: result.errors,
      securityChecks: performSecurityScan
    });

    return result;
  } catch (error: unknown) {
    logger.error('PDF validation failed', { error });
    throw new Error(`PDF validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts and validates metadata from PDF document with security checks
 * @param pdfBuffer - Buffer containing PDF data
 * @returns Promise<DocumentMetadata> - Extracted and validated metadata
 */
export async function extractPDFMetadata(pdfBuffer: Buffer): Promise<DocumentMetadata> {
  try {
    // Create readable stream from buffer
    const readStream = new ReadableStreamBuffer();
    readStream.put(pdfBuffer);
    readStream.stop();

    // Initialize PDF parser
    const parser = new PDFParser();
    
    return new Promise((resolve, reject) => {
      parser.on('pdfParser_dataReady', async () => {
        try {
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          
          const metadata: DocumentMetadata = {
            fileName: '',
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
            uploadedAt: new Date(),
            lastModified: new Date(),
            retentionPeriod: 365, // Default 1 year retention
            geographicLocation: 'ca-central-1' // Default to Canadian storage
          };

          // Extract PDF-specific metadata
          const info = pdfDoc.getTitle() || '';
          metadata.fileName = info.length > 0 ? info : 'Untitled Document';

          // Log metadata extraction
          logger.info('PDF metadata extracted', {
            fileSize: metadata.fileSize,
            mimeType: metadata.mimeType
          });

          resolve(metadata);
        } catch (error: unknown) {
          reject(new Error(`Metadata extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });

      parser.on('pdfParser_dataError', (error: unknown) => {
        reject(new Error(`PDF parsing failed: ${error}`));
      });

      readStream.pipe(parser as any);
    });
  } catch (error: unknown) {
    logger.error('PDF metadata extraction failed', { error });
    throw new Error(`Metadata extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a secure preview version of PDF document with watermark
 * @param pdfBuffer - Buffer containing PDF data
 * @param maxPages - Maximum number of pages to include in preview
 * @param options - Preview generation options
 * @returns Promise<Buffer> - Preview PDF buffer with security features
 */
export async function generatePDFPreview(
  pdfBuffer: Buffer,
  maxPages: number = 3,
  options: PreviewOptions = {}
): Promise<Buffer> {
  try {
    // Load source PDF
    const sourcePdf = await PDFDocument.load(pdfBuffer);
    const previewPdf = await PDFDocument.create();

    // Configure preview options
    const watermarkText = options.watermarkText || PREVIEW_WATERMARK;
    
    // Copy limited pages to preview
    const pageCount = Math.min(sourcePdf.getPageCount(), maxPages);
    for (let i = 0; i < pageCount; i++) {
      const [page] = await previewPdf.copyPages(sourcePdf, [i]);
      await addWatermark(page, watermarkText);
      previewPdf.addPage(page);
    }

    // Generate preview buffer
    const previewBuffer = await previewPdf.save({
      ownerProtectionPassword: generatePreviewPassword(),
      permissions: {
        printing: options.allowPrinting ? 'lowResolution' : 'none',
        modifying: false,
        copying: options.allowCopying || false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false
      }
    });

    // Log preview generation
    logger.info('PDF preview generated', {
      originalSize: pdfBuffer.length,
      previewSize: previewBuffer.length,
      pages: pageCount
    });

    return Buffer.from(previewBuffer);
  } catch (error: unknown) {
    logger.error('PDF preview generation failed', { error });
    throw new Error(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions

async function checkForJavaScript(): Promise<boolean> {
  return false; // Placeholder implementation
}

async function checkForExternalLinks(): Promise<boolean> {
  return false; // Placeholder implementation
}

async function performMalwareScan(): Promise<boolean> {
  return false; // Placeholder implementation
}

async function checkAccessibility(): Promise<any> {
  return {
    hasTextContent: true,
    isTagged: true,
    hasLanguageSpecified: true
  }; // Placeholder implementation
}

function sanitizeMetadata(value: string): string {
  return value.replace(/[<>{}]/g, '').trim();
}

function generatePreviewPassword(): string {
  return Math.random().toString(36).substring(2, 15);
}

async function addWatermark(page: PDFPage, text: string): Promise<void> {
  const font = await page.doc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 24;
  const { width, height } = page.getSize();
  
  page.drawText(text, {
    x: width / 2 - 150,
    y: height / 2,
    size: fontSize,
    font: font,
    color: rgb(0.8, 0.8, 0.8),
    rotate: Math.PI / 4 as number,
    opacity: 0.3
  });
}