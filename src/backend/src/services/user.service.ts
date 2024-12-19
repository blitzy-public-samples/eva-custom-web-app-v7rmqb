/**
 * Enhanced User Service for Estate Kit
 * Implements secure user management with field-level encryption and PIPEDA compliance
 * @version 1.0.0
 */

import { Service } from 'typedi'; // ^0.10.0
import { Repository } from 'typeorm'; // ^0.3.0
import { InjectRepository } from 'typeorm-typedi-extensions'; // ^0.4.1

import UserModel from '../db/models/user.model';
import { 
  User, 
  CreateUserDTO, 
  UpdateUserDTO, 
  UserRole, 
  UserStatus 
} from '../types/user.types';
import { AuditService } from './audit.service';
import { EncryptionService } from './encryption.service';
import { AuditEventType, AuditSeverity } from '../types/audit.types';
import { logger } from '../utils/logger.util';

@Service()
export class UserService {
  // Security constants
  private readonly SENSITIVE_FIELDS = ['phoneNumber'] as const;

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    private readonly auditService: AuditService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Creates a new user with encrypted sensitive data
   * @param userData User creation data
   * @returns Promise<User> Created user object
   */
  async createUser(userData: CreateUserDTO & { ipAddress?: string; userAgent?: string }): Promise<User> {
    try {
      // Validate input data
      this.validateUserData(userData);

      // Check for existing user
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create user model
      const user = new UserModel();
      user.email = userData.email;
      user.name = userData.name;
      user.role = UserRole.OWNER;
      user.status = UserStatus.PENDING;
      user.profile = {
        province: userData.province,
        phoneNumber: null,
        mfaEnabled: false,
        emailNotifications: true,
        smsNotifications: false,
        timezone: 'America/Toronto',
        language: 'en',
        lastLoginAt: null,
        auditEnabled: true
      };

      // Encrypt sensitive profile data
      await this.encryptSensitiveData(user);

      // Save user
      const savedUser = await this.userRepository.save(user);

      // Create audit log
      await this.auditService.createAuditLog({
        eventType: AuditEventType.USER_LOGIN,
        severity: AuditSeverity.INFO,
        userId: savedUser.id,
        resourceId: savedUser.id,
        resourceType: 'USER',
        ipAddress: userData.ipAddress || '0.0.0.0',
        userAgent: userData.userAgent || 'SYSTEM',
        details: {
          action: 'CREATE_USER',
          email: savedUser.email
        }
      });

      return savedUser;
    } catch (error) {
      logger.error('Failed to create user', { error, email: userData.email });
      throw error;
    }
  }

  /**
   * Retrieves user by ID with role-based access control
   * @param id User ID
   * @param requestingUserRole Role of requesting user
   * @returns Promise<User | null> User object if authorized
   */
  async getUserById(id: string, requestingUserRole: UserRole): Promise<User | null> {
    try {
      // Validate access permissions
      const hasAccess = await this.validateUserAccess(id, requestingUserRole, 'READ');
      if (!hasAccess) {
        throw new Error('Unauthorized access');
      }

      // Retrieve user
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        return null;
      }

      // Decrypt sensitive data if authorized
      if (this.canAccessSensitiveData(requestingUserRole)) {
        await this.decryptSensitiveData(user);
      }

      // Create audit log for access
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DOCUMENT_ACCESS,
        severity: AuditSeverity.INFO,
        userId: id,
        resourceId: id,
        resourceType: 'USER',
        ipAddress: '0.0.0.0',
        userAgent: 'SYSTEM',
        details: {
          action: 'READ_USER',
          requestingRole: requestingUserRole
        }
      });

      return user;
    } catch (error) {
      logger.error('Failed to retrieve user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Updates user information with encryption and audit logging
   * @param id User ID
   * @param updateData Update data
   * @param requestingUserRole Role of requesting user
   * @returns Promise<User> Updated user object
   */
  async updateUser(
    id: string, 
    updateData: UpdateUserDTO, 
    requestingUserRole: UserRole
  ): Promise<User> {
    try {
      // Validate access permissions
      const hasAccess = await this.validateUserAccess(id, requestingUserRole, 'UPDATE');
      if (!hasAccess) {
        throw new Error('Unauthorized access');
      }

      // Retrieve existing user
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new Error('User not found');
      }

      // Track changes for audit
      const changes = this.trackChanges(user, updateData);

      // Update user data
      Object.assign(user, {
        ...updateData,
        profile: {
          ...user.profile,
          ...updateData.profile
        }
      });

      // Encrypt updated sensitive data
      await this.encryptSensitiveData(user);

      // Save updated user
      const updatedUser = await this.userRepository.save(user);

      // Create audit log for update
      await this.auditService.createAuditLog({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.INFO,
        userId: id,
        resourceId: id,
        resourceType: 'USER',
        ipAddress: '0.0.0.0',
        userAgent: 'SYSTEM',
        details: {
          action: 'UPDATE_USER',
          changes,
          requestingRole: requestingUserRole
        }
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Validates user access permissions based on role
   * @private
   */
  private async validateUserAccess(
    userId: string,
    requestingRole: UserRole,
    operation: string
  ): Promise<boolean> {
    // Define role-based access permissions
    const permissions = {
      [UserRole.OWNER]: ['READ', 'UPDATE', 'DELETE'],
      [UserRole.EXECUTOR]: ['READ'],
      [UserRole.HEALTHCARE_PROXY]: ['READ'],
      [UserRole.FINANCIAL_ADVISOR]: ['READ'],
      [UserRole.LEGAL_ADVISOR]: ['READ']
    };

    const allowedOperations = permissions[requestingRole] || [];
    return allowedOperations.includes(operation);
  }

  /**
   * Encrypts sensitive user data
   * @private
   */
  private async encryptSensitiveData(user: UserModel): Promise<void> {
    if (user.profile) {
      for (const field of this.SENSITIVE_FIELDS) {
        if (user.profile[field]) {
          const encrypted = await this.encryptionService.encryptField(
            Buffer.from(user.profile[field] as string),
            process.env.ENCRYPTION_KEY as string
          );
          user.profile[field] = encrypted.content.toString('base64');
        }
      }
    }
  }

  /**
   * Decrypts sensitive user data
   * @private
   */
  private async decryptSensitiveData(user: UserModel): Promise<void> {
    if (user.profile) {
      for (const field of this.SENSITIVE_FIELDS) {
        if (user.profile[field]) {
          try {
            const decrypted = await this.encryptionService.decryptField(
              {
                content: Buffer.from(user.profile[field] as string, 'base64'),
                iv: Buffer.alloc(16),
                authTag: Buffer.alloc(16),
                keyVersion: '1',
                metadata: {
                  algorithm: 'aes-256-gcm',
                  timestamp: Date.now()
                }
              },
              process.env.ENCRYPTION_KEY as string
            );
            user.profile[field] = decrypted.toString();
          } catch (error) {
            logger.error(`Failed to decrypt ${field}`, { error, userId: user.id });
            user.profile[field] = null;
          }
        }
      }
    }
  }

  /**
   * Validates user input data
   * @private
   */
  private validateUserData(userData: CreateUserDTO): void {
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    if (!userData.name || userData.name.length < 2) {
      throw new Error('Invalid name format');
    }
    if (!userData.province) {
      throw new Error('Province is required');
    }
  }

  /**
   * Checks if role can access sensitive data
   * @private
   */
  private canAccessSensitiveData(role: UserRole): boolean {
    return [UserRole.OWNER, UserRole.EXECUTOR].includes(role);
  }

  /**
   * Tracks changes for audit logging
   * @private
   */
  private trackChanges(
    oldData: UserModel, 
    newData: UpdateUserDTO
  ): Record<string, any> {
    const changes: Record<string, any> = {};

    if (newData.name !== oldData.name) {
      changes.name = {
        from: oldData.name,
        to: newData.name
      };
    }

    if (newData.profile) {
      changes.profile = {};
      for (const [key, value] of Object.entries(newData.profile)) {
        if (oldData.profile[key as keyof typeof oldData.profile] !== value) {
          changes.profile[key] = {
            from: oldData.profile[key as keyof typeof oldData.profile],
            to: value
          };
        }
      }
    }

    return changes;
  }
}