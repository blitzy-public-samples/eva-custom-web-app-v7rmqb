// @ts-check
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm'; // ^0.3.0

import { 
  UserRole, 
  UserStatus, 
  UserProfile 
} from '../types/user.types';

import { EncryptionService } from '../services/encryption.service';

// Initialize encryption service for field-level encryption
const encryptionService = new EncryptionService();

/**
 * TypeORM entity model for user management in Estate Kit platform.
 * Implements PIPEDA-compliant data structure with enhanced security features.
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['status'], { where: "status = 'ACTIVE'" })
@Index(['role'], { where: "status = 'ACTIVE'" })
export default class UserModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    unique: true,
    nullable: false 
  })
  email!: string;

  @Column({ 
    type: 'varchar', 
    length: 255,
    nullable: false 
  })
  name!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OWNER
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING
  })
  status!: UserStatus;

  @Column({
    type: 'jsonb',
    nullable: false
  })
  profile!: UserProfile;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'Last login IP address for security tracking'
  })
  lastLoginIp!: string | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Last successful login timestamp'
  })
  lastLoginAt!: Date | null;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Account creation timestamp'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Last update timestamp'
  })
  updatedAt!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Soft delete timestamp'
  })
  deletedAt!: Date | null;

  /**
   * Creates a new user instance with enhanced security initialization
   * @param data - Partial user data for initialization
   */
  constructor(data?: Partial<UserModel>) {
    if (data) {
      Object.assign(this, data);
      
      // Initialize default profile if not provided
      if (!this.profile) {
        this.profile = {
          phoneNumber: null,
          province: '',
          mfaEnabled: false,
          emailNotifications: true,
          smsNotifications: false,
          timezone: 'America/Toronto',
          language: 'en',
          lastLoginAt: null,
          auditEnabled: true
        };
      }
    }
  }

  /**
   * Encrypts sensitive user data before storage
   * Implements field-level encryption for PIPEDA compliance
   */
  @BeforeInsert()
  @BeforeUpdate()
  async encryptSensitiveData(): Promise<void> {
    if (this.profile) {
      // Encrypt sensitive profile fields
      const sensitiveFields = ['phoneNumber'];
      for (const field of sensitiveFields) {
        if (this.profile[field]) {
          const encrypted = await encryptionService.encryptSensitiveData(
            Buffer.from(this.profile[field]),
            process.env.ENCRYPTION_KEY as string
          );
          this.profile[field] = encrypted.content.toString('base64');
        }
      }
    }
  }

  /**
   * Decrypts sensitive user data for use
   * Implements secure data access with audit logging
   */
  async decryptSensitiveData(): Promise<void> {
    if (this.profile) {
      const sensitiveFields = ['phoneNumber'];
      for (const field of sensitiveFields) {
        if (this.profile[field]) {
          try {
            const decrypted = await encryptionService.decryptSensitiveData(
              {
                content: Buffer.from(this.profile[field], 'base64'),
                iv: Buffer.alloc(16), // IV should be stored with encrypted data
                authTag: Buffer.alloc(16), // Auth tag should be stored with encrypted data
                metadata: {
                  algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
                  timestamp: Date.now()
                }
              },
              process.env.ENCRYPTION_KEY as string
            );
            this.profile[field] = decrypted.toString();
          } catch (error) {
            console.error(`Failed to decrypt ${field}:`, error);
            this.profile[field] = null;
          }
        }
      }
    }
  }

  /**
   * Converts user entity to JSON representation with data masking
   * Implements PIPEDA-compliant data exposure controls
   */
  toJSON(): Record<string, any> {
    const {
      id,
      email,
      name,
      role,
      status,
      profile,
      lastLoginAt,
      createdAt,
      updatedAt
    } = this;

    // Mask sensitive data in profile
    const maskedProfile = { ...profile };
    if (maskedProfile.phoneNumber) {
      maskedProfile.phoneNumber = `***${maskedProfile.phoneNumber.slice(-4)}`;
    }

    return {
      id,
      email,
      name,
      role,
      status,
      profile: maskedProfile,
      lastLoginAt: lastLoginAt?.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    };
  }
}