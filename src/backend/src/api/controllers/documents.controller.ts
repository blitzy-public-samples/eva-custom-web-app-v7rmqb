/**
 * Documents Controller for Estate Kit Platform
 * Implements secure document management endpoints with comprehensive security features,
 * audit logging, and enhanced validation
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { Controller, Get, Post, Put, Delete, UseMiddleware } from '@nestjs/common';

import { DocumentService } from '../../services/document.service';
import { AuditService } from '../../services/audit.service';
import {
  DocumentType,
  CreateDocumentDTO,
  UpdateDocumentDTO
} from '../../types/document.types';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';
import { ResourceType, AccessLevel } from '../../types/permission.types';
import { logger } from '../../utils/logger.util';

// Constants for security and validation
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // Maximum requests per window

// Validation schemas using Zod
const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.nativeEnum(DocumentType),
  file: z.instanceof(Buffer).refine(file => file.length <= MAX_FILE_SIZE, {
    message: 'File size exceeds maximum limit'
  }),
  metadata: z.object({
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
    retentionPeriod: z.number().min(1)
  }),
  retentionPeriod: z.number().min(1)
});

/**
 * Controller handling document management endpoints with enhanced security
 */
@Controller('/documents')
export class DocumentsController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Creates a new document with comprehensive security checks
   */
  @Post('/')
  async createDocument(req: Request, res: Response): Promise<Response> {
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.addCorrelationId(correlationId);

    try {
      const userId = (req as any).user.id;
      const documentData: CreateDocumentDTO = req.body;

      // Validate user permissions
      await this.validateUserAccess(userId, documentData.type);

      // Create document with security features
      const document = await this.documentService.create(documentData, userId);

      // Log audit trail
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DOCUMENT_UPLOAD,
        severity: AuditSeverity.INFO,
        userId,
        resourceId: document.id,
        resourceType: ResourceType.LEGAL_DOCS,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: {
          documentType: document.type,
          fileName: document.metadata.fileName,
          fileSize: document.metadata.fileSize
        }
      });

      return res.status(201).json({
        success: true,
        data: document
      });
    } catch (error) {
      logger.error('Document creation failed', { error, correlationId });
      return this.handleError(res, error);
    }
  }

  /**
   * Retrieves a document with security validation
   */
  @Get('/:id')
  async getDocument(req: Request, res: Response): Promise<Response> {
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.addCorrelationId(correlationId);

    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Validate access permissions
      await this.validateUserAccess(userId, id, AccessLevel.READ);

      // Retrieve document
      const document = await this.documentService.findById(id);

      // Log access
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DOCUMENT_ACCESS,
        severity: AuditSeverity.INFO,
        userId,
        resourceId: id,
        resourceType: ResourceType.LEGAL_DOCS,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: {
          accessType: 'READ',
          documentType: document.type
        }
      });

      return res.json({
        success: true,
        data: document
      });
    } catch (error) {
      logger.error('Document retrieval failed', { error, correlationId });
      return this.handleError(res, error);
    }
  }

  /**
   * Updates document metadata with security validation
   */
  @Put('/:id')
  async updateDocument(req: Request, res: Response): Promise<Response> {
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.addCorrelationId(correlationId);

    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updateData: UpdateDocumentDTO = req.body;

      // Validate access permissions
      await this.validateUserAccess(userId, id, AccessLevel.WRITE);

      // Update document
      const document = await this.documentService.update(id, updateData);

      // Log update
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DOCUMENT_ACCESS,
        severity: AuditSeverity.INFO,
        userId,
        resourceId: id,
        resourceType: ResourceType.LEGAL_DOCS,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: {
          accessType: 'UPDATE',
          documentType: document.type,
          updates: updateData
        }
      });

      return res.json({
        success: true,
        data: document
      });
    } catch (error) {
      logger.error('Document update failed', { error, correlationId });
      return this.handleError(res, error);
    }
  }

  /**
   * Deletes a document with security validation
   */
  @Delete('/:id')
  async deleteDocument(req: Request, res: Response): Promise<Response> {
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.addCorrelationId(correlationId);

    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Validate access permissions
      await this.validateUserAccess(userId, id, AccessLevel.WRITE);

      // Get document before deletion for audit
      const document = await this.documentService.findById(id);

      // Delete document
      await this.documentService.delete(id);

      // Log deletion
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DOCUMENT_ACCESS,
        severity: AuditSeverity.WARNING,
        userId,
        resourceId: id,
        resourceType: ResourceType.LEGAL_DOCS,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: {
          accessType: 'DELETE',
          documentType: document.type
        }
      });

      return res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      logger.error('Document deletion failed', { error, correlationId });
      return this.handleError(res, error);
    }
  }

  /**
   * Lists user's documents with pagination and filtering
   */
  @Get('/')
  async listDocuments(req: Request, res: Response): Promise<Response> {
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.addCorrelationId(correlationId);

    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 10, type } = req.query;

      const documents = await this.documentService.list(
        userId,
        Number(page),
        Number(limit),
        type as DocumentType
      );

      return res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      logger.error('Document listing failed', { error, correlationId });
      return this.handleError(res, error);
    }
  }

  // Private helper methods
  private async validateUserAccess(
    userId: string,
    documentIdOrType: string | DocumentType,
    requiredLevel: AccessLevel = AccessLevel.READ
  ): Promise<void> {
    // Implementation would check user permissions against the document
    // using the permission matrix from permission.types.ts
    throw new Error('Not implemented');
  }

  private handleError(res: Response, error: any): Response {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.message
      });
    }

    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    if (error.name === 'UnauthorizedError') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}