/**
 * TypeORM entity model for managing granular permissions in Estate Kit platform.
 * Implements role-based access control (RBAC) with enhanced security features,
 * optimized performance through strategic indexing, and comprehensive audit logging.
 * @version 1.0.0
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'; // ^0.3.0

import { ResourceType, AccessLevel } from '../../types/permission.types';
import { DelegateEntity } from './delegate.model';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

@Entity('permissions')
@Index('IDX_DELEGATE', ['delegateId'])
@Index('IDX_RESOURCE', ['resourceType'])
@Index('IDX_ACCESS', ['accessLevel'])
@Index('IDX_DELEGATE_RESOURCE', ['delegateId', 'resourceType'])
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'uuid', nullable: false })
  delegateId: string = '';

  @Column({
    type: 'enum',
    enum: ResourceType,
    nullable: false,
    comment: 'Type of resource being accessed'
  })
  resourceType!: ResourceType;

  @Column({
    type: 'enum',
    enum: AccessLevel,
    default: AccessLevel.NONE,
    comment: 'Level of access granted'
  })
  accessLevel!: AccessLevel;

  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    comment: 'Permission expiration date'
  })
  expiresAt: Date = new Date();

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether the permission is currently active'
  })
  isActive: boolean = true;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'User ID who granted this permission'
  })
  grantedBy: string = '';

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional permission metadata and audit information'
  })
  metadata: {
    lastAccessed?: Date;
    accessCount?: number;
    restrictions?: string[];
    auditTrail?: Array<{
      action: string;
      timestamp: Date;
      performedBy: string;
    }>;
  } = {};

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Record creation timestamp'
  })
  createdAt: Date = new Date();

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Record update timestamp'
  })
  updatedAt: Date = new Date();

  @ManyToOne(() => DelegateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delegateId' })
  delegate!: DelegateEntity;

  /**
   * Creates a new permission entity with enhanced validation and security checks
   * @param permissionData Initial permission data
   */
  constructor(permissionData?: Partial<PermissionEntity>) {
    if (permissionData) {
      // Validate required fields
      if (!permissionData.delegateId || !permissionData.resourceType) {
        throw new Error('Missing required permission fields');
      }

      // Initialize entity with provided data
      Object.assign(this, permissionData);

      // Set default access level if not provided
      if (!this.accessLevel) {
        this.accessLevel = AccessLevel.NONE;
      }

      // Initialize metadata
      this.metadata = {
        lastAccessed: undefined,
        accessCount: 0,
        restrictions: [],
        auditTrail: [{
          action: 'PERMISSION_CREATED',
          timestamp: new Date(),
          performedBy: permissionData.grantedBy || ''
        }]
      };

      // Validate expiration date
      if (this.expiresAt && new Date(this.expiresAt) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
    }
  }

  /**
   * Checks if permission grants required access level with security validation
   * @param requiredLevel Required access level to check
   * @returns boolean indicating if permission grants required access
   */
  async hasAccess(requiredLevel: AccessLevel): Promise<boolean> {
    try {
      // Check if permission is active
      if (!this.isActive) {
        return false;
      }

      // Check expiration
      if (new Date() >= this.expiresAt) {
        this.isActive = false;
        return false;
      }

      // Update access tracking
      if (this.metadata) {
        this.metadata.lastAccessed = new Date();
        this.metadata.accessCount = (this.metadata.accessCount || 0) + 1;
      }

      // Check access level
      return this.accessLevel >= requiredLevel;
    } catch (error) {
      return false;
    }
  }

  /**
   * Transforms entity for JSON serialization with security considerations
   * @returns Sanitized permission object
   */
  toJSON(): Record<string, any> {
    const {
      id,
      delegateId,
      resourceType,
      accessLevel,
      isActive,
      expiresAt,
      createdAt,
      updatedAt,
      metadata
    } = this;

    // Filter sensitive metadata
    const sanitizedMetadata = metadata ? {
      lastAccessed: metadata.lastAccessed,
      accessCount: metadata.accessCount,
      restrictions: metadata.restrictions
    } : null;

    return {
      id,
      delegateId,
      resourceType,
      accessLevel,
      isActive,
      expiresAt: expiresAt?.toISOString(),
      createdAt: createdAt?.toISOString(),
      updatedAt: updatedAt?.toISOString(),
      metadata: sanitizedMetadata
    };
  }
}