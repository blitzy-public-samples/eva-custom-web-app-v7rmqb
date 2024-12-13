// @ts-check
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { faker } from '@faker-js/faker'; // ^8.0.0
import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentMetadata,
  DocumentAudit,
  DocumentEncryption
} from '../../src/types/document.types';
import { DocumentModel } from '../../src/db/models/document.model';

// Constants for mock data generation
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_ENCRYPTION_KEY = 'kms:alias/estate-kit-document-key';

/**
 * Interface for security options in mock document creation
 */
interface SecurityOptions {
  encryptionEnabled?: boolean;
  pipedaCompliant?: boolean;
  auditTrailEnabled?: boolean;
  delegateAccess?: Array<{
    delegateId: string;
    permissions: string[];
  }>;
}

/**
 * Base mock document with enhanced security features
 */
export const mockDocument: Document = {
  id: uuidv4(),
  userId: MOCK_USER_ID,
  title: 'Test Document',
  type: DocumentType.LEGAL,
  status: DocumentStatus.COMPLETED,
  metadata: {
    fileName: 'test-document.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    uploadedAt: new Date('2024-01-01T00:00:00Z'),
    lastModified: new Date('2024-01-01T00:00:00Z'),
    checksum: faker.string.alphanumeric(64), // SHA-256 hash
    retentionPolicy: '7-years',
    jurisdiction: 'ON',
    classification: 'confidential'
  },
  storageDetails: {
    bucket: 'estate-kit-documents',
    key: `users/${MOCK_USER_ID}/test-document.pdf`,
    version: '1',
    encryptionType: 'AES-256',
    kmsKeyId: MOCK_ENCRYPTION_KEY,
    encryptionContext: {
      userId: MOCK_USER_ID,
      documentId: uuidv4()
    }
  },
  security: {
    accessControl: {
      owner: MOCK_USER_ID,
      delegates: [],
      permissions: 'read-write'
    },
    encryption: {
      algorithm: 'AES-256',
      keyRotation: 'enabled',
      lastRotated: new Date('2024-01-01T00:00:00Z')
    },
    compliance: {
      pipeda: true,
      hipaa: false,
      gdpr: false
    }
  },
  auditTrail: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
};

/**
 * Factory function to create customized mock documents with enhanced security features
 * @param overrides - Optional document property overrides
 * @param securityOptions - Optional security configuration
 * @returns Mock document with security features and audit trail
 */
export function createMockDocument(
  overrides: Partial<Document> = {},
  securityOptions: SecurityOptions = {}
): Document {
  const documentId = uuidv4();
  const now = new Date();

  // Generate base document with security features
  const document: Document = {
    ...mockDocument,
    id: documentId,
    title: faker.system.fileName(),
    metadata: {
      ...mockDocument.metadata,
      fileName: `${faker.system.fileName()}.pdf`,
      fileSize: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
      uploadedAt: now,
      lastModified: now,
      checksum: faker.string.alphanumeric(64),
    },
    storageDetails: {
      ...mockDocument.storageDetails,
      key: `users/${MOCK_USER_ID}/${documentId}.pdf`,
      version: faker.string.numeric(8),
      encryptionContext: {
        userId: MOCK_USER_ID,
        documentId
      }
    },
    security: {
      ...mockDocument.security,
      encryption: {
        algorithm: securityOptions.encryptionEnabled ? 'AES-256' : 'none',
        keyRotation: securityOptions.encryptionEnabled ? 'enabled' : 'disabled',
        lastRotated: securityOptions.encryptionEnabled ? now : null
      },
      compliance: {
        pipeda: securityOptions.pipedaCompliant ?? true,
        hipaa: false,
        gdpr: false
      }
    },
    createdAt: now,
    updatedAt: now
  };

  // Add delegate access if specified
  if (securityOptions.delegateAccess?.length) {
    document.security.accessControl.delegates = securityOptions.delegateAccess.map(delegate => ({
      delegateId: delegate.delegateId,
      permissions: delegate.permissions,
      grantedAt: now
    }));
  }

  // Generate audit trail if enabled
  if (securityOptions.auditTrailEnabled) {
    document.auditTrail = createMockAuditTrail(documentId, {
      includeAccessEvents: true,
      includeDelegateEvents: !!securityOptions.delegateAccess?.length
    });
  }

  // Apply any custom overrides
  return {
    ...document,
    ...overrides
  };
}

/**
 * Array of mock documents with various security scenarios
 */
export const mockDocumentList: Document[] = [
  createMockDocument({ type: DocumentType.LEGAL }, { encryptionEnabled: true, pipedaCompliant: true }),
  createMockDocument({ type: DocumentType.MEDICAL }, { encryptionEnabled: true, pipedaCompliant: true }),
  createMockDocument({ type: DocumentType.FINANCIAL }, { encryptionEnabled: true, pipedaCompliant: true }),
  createMockDocument({ type: DocumentType.PERSONAL }, { encryptionEnabled: true, pipedaCompliant: true })
];

/**
 * Interface for audit trail generation options
 */
interface AuditOptions {
  includeAccessEvents?: boolean;
  includeDelegateEvents?: boolean;
  eventCount?: number;
}

/**
 * Generates mock audit trail entries for document testing
 * @param documentId - Document identifier
 * @param options - Audit trail generation options
 * @returns Array of audit trail entries
 */
export function createMockAuditTrail(
  documentId: string,
  options: AuditOptions = {}
): DocumentAudit[] {
  const auditTrail: DocumentAudit[] = [];
  const eventCount = options.eventCount || 5;
  const now = new Date();

  // Document creation event
  auditTrail.push({
    timestamp: new Date(now.getTime() - 86400000), // 1 day ago
    operation: 'DOCUMENT_CREATED',
    userId: MOCK_USER_ID,
    details: {
      documentId,
      version: '1',
      encryption: 'AES-256'
    }
  });

  if (options.includeAccessEvents) {
    // Generate access events
    for (let i = 0; i < eventCount; i++) {
      auditTrail.push({
        timestamp: new Date(now.getTime() - (86400000 - i * 3600000)),
        operation: 'DOCUMENT_ACCESSED',
        userId: MOCK_USER_ID,
        details: {
          documentId,
          accessType: 'READ',
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent()
        }
      });
    }
  }

  if (options.includeDelegateEvents) {
    // Generate delegate access events
    const delegateId = uuidv4();
    auditTrail.push({
      timestamp: new Date(now.getTime() - 43200000), // 12 hours ago
      operation: 'DELEGATE_ACCESS_GRANTED',
      userId: MOCK_USER_ID,
      details: {
        documentId,
        delegateId,
        permissions: ['READ'],
        grantedBy: MOCK_USER_ID
      }
    });

    auditTrail.push({
      timestamp: new Date(now.getTime() - 21600000), // 6 hours ago
      operation: 'DOCUMENT_ACCESSED',
      userId: delegateId,
      details: {
        documentId,
        accessType: 'READ',
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        delegateAccess: true
      }
    });
  }

  return auditTrail.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}