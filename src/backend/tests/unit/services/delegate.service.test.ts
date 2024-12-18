import { describe, beforeEach, it, expect, jest } from '@jest/globals'; // ^29.0.0
import { Repository } from 'typeorm'; // ^0.3.0
import MockDate from 'mockdate'; // ^3.0.0

import { DelegateService } from '../../src/services/delegate.service';
import { 
  mockDelegateEntity, 
  createMockDelegate, 
  mockCreateDelegateDTO,
  createExpiredMockDelegate,
  createPendingMockDelegate 
} from '../../mocks/delegate.mock';
import { 
  ResourceType, 
  AccessLevel, 
  DelegateStatus,
  UserRole 
} from '../../src/types/delegate.types';
import { AuditEventType, AuditSeverity } from '../../src/types/audit.types';

describe('DelegateService', () => {
  let delegateService: DelegateService;
  let mockDelegateRepository: jest.Mocked<Repository<any>>;
  let mockEncryptionService: jest.Mocked<any>;
  let mockAuditService: jest.Mocked<any>;
  let mockCloudWatch: jest.Mocked<any>;

  beforeEach(() => {
    // Reset date mock
    MockDate.reset();

    // Initialize mocks
    mockDelegateRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEncryptionService = {
      encryptSensitiveData: jest.fn(),
      decryptSensitiveData: jest.fn()
    };

    mockAuditService = {
      createAuditLog: jest.fn()
    };

    mockCloudWatch = {
      putMetricData: jest.fn()
    };

    // Initialize service with mocks
    delegateService = new DelegateService(
      mockDelegateRepository,
      mockEncryptionService,
      mockAuditService
    );
    (delegateService as any).cloudWatch = mockCloudWatch;
  });

  describe('createDelegate', () => {
    it('should successfully create a new delegate with valid data', async () => {
      // Arrange
      const ownerId = 'owner-123';
      const delegateData = { ...mockCreateDelegateDTO };
      const encryptedData = {
        content: Buffer.from('encrypted'),
        iv: Buffer.alloc(16),
        authTag: Buffer.alloc(16)
      };
      const savedDelegate = { ...mockDelegateEntity };

      mockEncryptionService.encryptSensitiveData.mockResolvedValue(encryptedData);
      mockDelegateRepository.create.mockReturnValue(savedDelegate);
      mockDelegateRepository.save.mockResolvedValue(savedDelegate);

      // Act
      const result = await delegateService.createDelegate(ownerId, delegateData);

      // Assert
      expect(result).toEqual(savedDelegate);
      expect(mockEncryptionService.encryptSensitiveData).toHaveBeenCalled();
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith({
        eventType: AuditEventType.DELEGATE_INVITE,
        severity: AuditSeverity.INFO,
        userId: ownerId,
        resourceId: savedDelegate.id,
        resourceType: 'DELEGATE',
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        details: expect.any(Object)
      });
      expect(mockCloudWatch.putMetricData).toHaveBeenCalled();
    });

    it('should validate delegate data before creation', async () => {
      // Arrange
      const ownerId = 'owner-123';
      const invalidData = { 
        ...mockCreateDelegateDTO,
        email: 'invalid-email' 
      };

      // Act & Assert
      await expect(
        delegateService.createDelegate(ownerId, invalidData)
      ).rejects.toThrow('Invalid delegate email');
    });

    it('should handle encryption failures gracefully', async () => {
      // Arrange
      const ownerId = 'owner-123';
      const delegateData = { ...mockCreateDelegateDTO };
      mockEncryptionService.encryptSensitiveData.mockRejectedValue(
        new Error('Encryption failed')
      );

      // Act & Assert
      await expect(
        delegateService.createDelegate(ownerId, delegateData)
      ).rejects.toThrow('Encryption failed');
    });
  });

  describe('verifyDelegateAccess', () => {
    it('should verify access for active delegate with valid permissions', async () => {
      // Arrange
      const delegateId = 'delegate-123';
      const resourceType = ResourceType.FINANCIAL_DATA;
      const requiredAccess = AccessLevel.READ;
      const delegate = createMockDelegate({
        status: DelegateStatus.ACTIVE
      });

      mockDelegateRepository.findOne.mockResolvedValue(delegate);
      mockEncryptionService.decryptSensitiveData.mockResolvedValue(
        Buffer.from(JSON.stringify({
          permissions: [{
            resourceType: ResourceType.FINANCIAL_DATA,
            accessLevel: AccessLevel.READ
          }]
        }))
      );

      // Act
      const result = await delegateService.verifyDelegateAccess(
        delegateId,
        resourceType,
        requiredAccess
      );

      // Assert
      expect(result).toBe(true);
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.DELEGATE_ACCESS,
          severity: AuditSeverity.INFO
        })
      );
    });

    it('should deny access for expired delegates', async () => {
      // Arrange
      const delegateId = 'delegate-123';
      const resourceType = ResourceType.FINANCIAL_DATA;
      const requiredAccess = AccessLevel.READ;
      const expiredDelegate = createExpiredMockDelegate();

      mockDelegateRepository.findOne.mockResolvedValue(expiredDelegate);

      // Act
      const result = await delegateService.verifyDelegateAccess(
        delegateId,
        resourceType,
        requiredAccess
      );

      // Assert
      expect(result).toBe(false);
      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith(
        expect.objectContaining({
          MetricName: 'DelegateAccessDenied'
        })
      );
    });

    it('should enforce role-based access control', async () => {
      // Arrange
      const delegateId = 'delegate-123';
      const resourceType = ResourceType.MEDICAL_DATA;
      const requiredAccess = AccessLevel.READ;
      const delegate = createMockDelegate({
        role: UserRole.FINANCIAL_ADVISOR
      });

      mockDelegateRepository.findOne.mockResolvedValue(delegate);
      mockEncryptionService.decryptSensitiveData.mockResolvedValue(
        Buffer.from(JSON.stringify({
          permissions: [{
            resourceType: ResourceType.FINANCIAL_DATA,
            accessLevel: AccessLevel.READ
          }]
        }))
      );

      // Act
      const result = await delegateService.verifyDelegateAccess(
        delegateId,
        resourceType,
        requiredAccess
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validatePermissionMatrix', () => {
    it('should validate permissions against role matrix', () => {
      // Arrange
      const validPermissions = [{
        resourceType: ResourceType.FINANCIAL_DATA,
        accessLevel: AccessLevel.READ
      }];

      // Act & Assert
      expect(() => {
        (delegateService as any).validatePermissionMatrix(
          UserRole.FINANCIAL_ADVISOR,
          validPermissions
        )
      }).not.toThrow();
    });

    it('should reject invalid permissions for role', () => {
      // Arrange
      const invalidPermissions = [{
        resourceType: ResourceType.MEDICAL_DATA,
        accessLevel: AccessLevel.WRITE
      }];

      // Act & Assert
      expect(() => {
        (delegateService as any).validatePermissionMatrix(
          UserRole.FINANCIAL_ADVISOR,
          invalidPermissions
        )
      }).toThrow('Invalid permissions for role');
    });
  });

  describe('temporal access controls', () => {
    it('should enforce access expiration', async () => {
      // Arrange
      const delegateId = 'delegate-123';
      const resourceType = ResourceType.FINANCIAL_DATA;
      const requiredAccess = AccessLevel.READ;
      
      MockDate.set('2024-01-01');
      const expiredDelegate = createMockDelegate({
        expiresAt: new Date('2023-12-31')
      });

      mockDelegateRepository.findOne.mockResolvedValue(expiredDelegate);

      // Act
      const result = await delegateService.verifyDelegateAccess(
        delegateId,
        resourceType,
        requiredAccess
      );

      // Assert
      expect(result).toBe(false);
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.DELEGATE_ACCESS,
          severity: AuditSeverity.WARNING
        })
      );
    });
  });

  describe('audit logging', () => {
    it('should log all delegate access attempts', async () => {
      // Arrange
      const delegateId = 'delegate-123';
      const resourceType = ResourceType.FINANCIAL_DATA;
      const requiredAccess = AccessLevel.READ;
      const delegate = createMockDelegate();

      mockDelegateRepository.findOne.mockResolvedValue(delegate);
      mockEncryptionService.decryptSensitiveData.mockResolvedValue(
        Buffer.from(JSON.stringify({
          permissions: [{
            resourceType: ResourceType.FINANCIAL_DATA,
            accessLevel: AccessLevel.READ
          }]
        }))
      );

      // Act
      await delegateService.verifyDelegateAccess(
        delegateId,
        resourceType,
        requiredAccess
      );

      // Assert
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.DELEGATE_ACCESS,
          resourceId: delegateId,
          details: expect.objectContaining({
            resourceType,
            requiredAccess,
            accessGranted: true
          })
        })
      );
    });
  });
});