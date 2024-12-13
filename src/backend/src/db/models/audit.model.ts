/**
 * TypeORM entity model for Estate Kit's audit logging system
 * Implements PIPEDA and HIPAA compliant audit trail functionality
 * @version 1.0.0
 */

import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  Index 
} from 'typeorm'; // ^0.3.0

import { 
  AuditEventType, 
  AuditSeverity 
} from '../types/audit.types';

/**
 * Entity model for storing comprehensive system audit logs
 * Supports security monitoring, data privacy controls, and access logging
 * requirements for PIPEDA and HIPAA compliance
 */
@Entity('audit_logs')
@Index(['eventType', 'severity', 'userId', 'createdAt'])
export class AuditModel {
  /**
   * Unique identifier for the audit log entry
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of audited event (e.g., USER_LOGIN, DOCUMENT_ACCESS)
   * Used for categorizing and filtering security events
   */
  @Column({ 
    type: 'enum', 
    enum: AuditEventType,
    comment: 'Type of the audited security or system event'
  })
  eventType: AuditEventType;

  /**
   * Severity level of the audit event
   * Helps in prioritizing and filtering security incidents
   */
  @Column({ 
    type: 'enum', 
    enum: AuditSeverity,
    comment: 'Severity level of the audit event for incident classification'
  })
  severity: AuditSeverity;

  /**
   * ID of the user who performed the audited action
   * Required for user accountability and access tracking
   */
  @Column({
    comment: 'ID of the user who performed the action'
  })
  userId: string;

  /**
   * ID of the affected resource (optional)
   * Used for tracking specific document or resource access
   */
  @Column({ 
    nullable: true,
    comment: 'ID of the affected resource (document, delegate, etc.)'
  })
  resourceId: string;

  /**
   * Type of resource being accessed or modified
   * Helps in categorizing and filtering resource-specific events
   */
  @Column({
    comment: 'Type of resource being accessed or modified'
  })
  resourceType: string;

  /**
   * IP address of the request
   * Required for security monitoring and incident investigation
   */
  @Column({
    comment: 'IP address from which the request originated'
  })
  ipAddress: string;

  /**
   * User agent string from the request
   * Helps in identifying client software and potential security issues
   */
  @Column({
    comment: 'User agent string identifying the client software'
  })
  userAgent: string;

  /**
   * Additional event-specific details stored as JSONB
   * Allows flexible storage of contextual information
   */
  @Column({ 
    type: 'jsonb', 
    nullable: true,
    comment: 'Additional event-specific details in JSON format'
  })
  details: Record<string, any>;

  /**
   * Timestamp when the audit log was created
   * Automatically set by TypeORM
   */
  @CreateDateColumn({
    comment: 'Timestamp when the audit log was created'
  })
  createdAt: Date;
}