import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'; // ^29.0.0
import { Container } from 'typedi'; // ^0.10.0
import { Repository } from 'typeorm';
import { UserService } from '../../src/services/user.service';
import { 
  createMockUser, 
  createMockCreateUserDTO, 
  createMockUpdateUserDTO,
  createMockUserWithRole,
  createMockSuspendedUser 
} from '../../mocks/user.mock';
import { 
  User, 
  UserRole, 
  UserStatus 
} from '../../src/types/user.types';
import { AuditEventType, AuditSeverity } from '../../src/types/audit.types';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<Repository<User>>;
  let mockAuditService: jest.Mocked<any>;
  let mockEncryptionService: jest.Mocked<any>;

  // Mock data
  const mockUser = createMockUser();
  const mockCreateDTO = createMockCreateUserDTO();
  const mockUpdateDTO = createMockUpdateUserDTO();

  beforeEach(() => {
    // Clear container and reset mocks
    Container.reset();

    // Create mock repository
    mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    // Create mock audit service
    mockAuditService = {
      createAuditLog: jest.fn()
    };

    // Create mock encryption service
    mockEncryptionService = {
      encryptSensitiveData: jest.fn(),
      decryptSensitiveData: jest.fn()
    };

    // Set up dependency injection
    Container.set('UserRepository', mockUserRepository);
    Container.set('AuditService', mockAuditService);
    Container.set('EncryptionService', mockEncryptionService);

    // Initialize service
    userService = new UserService(
      mockUserRepository,
      mockAuditService,
      mockEncryptionService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with encrypted sensitive data', async () => {
      // Arrange
      const encryptedData = Buffer.from('encrypted');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockEncryptionService.encryptSensitiveData.mockResolvedValue({
        content: encryptedData,
        iv: Buffer.alloc(16),
        authTag: Buffer.alloc(16)
      });

      // Act
      const result = await userService.createUser(mockCreateDTO);

      // Assert
      expect(result).toBeDefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockEncryptionService.encryptSensitiveData).toHaveBeenCalled();
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.USER_LOGIN,
          severity: AuditSeverity.INFO
        })
      );
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.createUser(mockCreateDTO))
        .rejects
        .toThrow('User already exists');
    });

    it('should validate user data before creation', async () => {
      // Arrange
      const invalidDTO = { ...mockCreateDTO, email: 'invalid-email' };

      // Act & Assert
      await expect(userService.createUser(invalidDTO))
        .rejects
        .toThrow('Invalid email format');
    });
  });

  describe('getUserById', () => {
    it('should return user with decrypted data for authorized role', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEncryptionService.decryptSensitiveData.mockResolvedValue(
        Buffer.from('decrypted')
      );

      // Act
      const result = await userService.getUserById(
        mockUser.id,
        UserRole.OWNER
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalled();
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.DOCUMENT_ACCESS
        })
      );
    });

    it('should not decrypt sensitive data for unauthorized role', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById(
        mockUser.id,
        UserRole.FINANCIAL_ADVISOR
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockEncryptionService.decryptSensitiveData).not.toHaveBeenCalled();
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userService.getUserById(
        'non-existent-id',
        UserRole.OWNER
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user with encrypted sensitive data', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        ...mockUpdateDTO
      });
      mockEncryptionService.encryptSensitiveData.mockResolvedValue({
        content: Buffer.from('encrypted'),
        iv: Buffer.alloc(16),
        authTag: Buffer.alloc(16)
      });

      // Act
      const result = await userService.updateUser(
        mockUser.id,
        mockUpdateDTO,
        UserRole.OWNER
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockEncryptionService.encryptSensitiveData).toHaveBeenCalled();
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.PERMISSION_CHANGE
        })
      );
    });

    it('should throw error for unauthorized update attempt', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.updateUser(
        mockUser.id,
        mockUpdateDTO,
        UserRole.FINANCIAL_ADVISOR
      )).rejects.toThrow('Unauthorized access');
    });

    it('should track changes for audit logging', async () => {
      // Arrange
      const originalUser = createMockUser();
      mockUserRepository.findOne.mockResolvedValue(originalUser);
      mockUserRepository.save.mockResolvedValue({
        ...originalUser,
        ...mockUpdateDTO
      });

      // Act
      await userService.updateUser(
        originalUser.id,
        mockUpdateDTO,
        UserRole.OWNER
      );

      // Assert
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            changes: expect.any(Object)
          })
        })
      );
    });
  });

  describe('Security Features', () => {
    it('should validate password policy', async () => {
      // Test implementation for password policy validation
      const weakPassword = 'weak';
      const strongPassword = 'StrongP@ssw0rd123';

      expect(userService['validatePasswordPolicy'](weakPassword)).toBeFalsy();
      expect(userService['validatePasswordPolicy'](strongPassword)).toBeTruthy();
    });

    it('should handle MFA configuration', async () => {
      // Test implementation for MFA setup
      const mfaConfig = { enabled: true, method: 'APP' };
      const result = await userService['configureMFA'](mockUser.id, mfaConfig);

      expect(result).toBeDefined();
      expect(result.mfaEnabled).toBeTruthy();
    });

    it('should enforce role-based access control', async () => {
      // Test RBAC implementation
      const ownerAccess = await userService['validateUserAccess'](
        mockUser.id,
        UserRole.OWNER,
        'UPDATE'
      );
      const advisorAccess = await userService['validateUserAccess'](
        mockUser.id,
        UserRole.FINANCIAL_ADVISOR,
        'UPDATE'
      );

      expect(ownerAccess).toBeTruthy();
      expect(advisorAccess).toBeFalsy();
    });
  });

  describe('Compliance Requirements', () => {
    it('should maintain audit trail for user operations', async () => {
      // Arrange
      const sensitiveOperation = async () => {
        await userService.updateUser(
          mockUser.id,
          mockUpdateDTO,
          UserRole.OWNER
        );
      };

      // Act
      await sensitiveOperation();

      // Assert
      expect(mockAuditService.createAuditLog).toHaveBeenCalled();
      const auditCall = mockAuditService.createAuditLog.mock.calls[0][0];
      expect(auditCall).toMatchObject({
        eventType: expect.any(String),
        severity: expect.any(String),
        userId: expect.any(String),
        details: expect.any(Object)
      });
    });

    it('should handle user status changes with compliance logging', async () => {
      // Arrange
      const statusUpdate = {
        status: UserStatus.SUSPENDED,
        reason: 'Security policy violation'
      };

      // Act
      await userService['updateUserStatus'](mockUser.id, statusUpdate);

      // Assert
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.PERMISSION_CHANGE,
          severity: AuditSeverity.WARNING,
          details: expect.objectContaining({
            statusChange: expect.any(Object)
          })
        })
      );
    });
  });
});