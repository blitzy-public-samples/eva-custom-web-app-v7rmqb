/**
 * @fileoverview TypeORM entity model for subscription management in Estate Kit platform
 * Implements comprehensive subscription plans, billing cycles, audit logging, and Shopify integration
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
  Index,
  BeforeUpdate,
  AfterUpdate
} from 'typeorm'; // ^0.3.0

import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle
} from '../../types/subscription.types';

import { UserModel } from './user.model';
import { AuditLogEntry } from '../../types/audit.types';

/**
 * TypeORM entity model for subscription management with enhanced audit logging and validation
 */
@Entity('subscriptions')
@Index(['userId'])
@Index(['status'])
@Index(['plan'])
@Index(['shopifySubscriptionId'], { unique: true })
@Index(['lastBillingDate'])
@Index(['nextBillingDate'])
export default class SubscriptionModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserModel;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE
  })
  plan!: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING
  })
  status!: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    nullable: false
  })
  billingCycle!: BillingCycle;

  @Column({
    type: 'timestamp with time zone',
    nullable: false
  })
  startDate!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true
  })
  endDate!: Date | null;

  @Column({
    type: 'boolean',
    default: true
  })
  autoRenew!: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false
  })
  shopifySubscriptionId!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false
  })
  shopifyCustomerId!: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true
  })
  lastBillingDate!: Date | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true
  })
  nextBillingDate!: Date | null;

  @Column({
    type: 'jsonb',
    nullable: false,
    default: []
  })
  auditLogs!: AuditLogEntry[];

  @CreateDateColumn({
    type: 'timestamp with time zone'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone'
  })
  updatedAt!: Date;

  /**
   * Creates a new subscription instance with comprehensive validation
   * @param data - Partial subscription data for initialization
   */
  constructor(data?: Partial<SubscriptionModel>) {
    if (data) {
      // Validate required fields
      if (!data.userId || !data.shopifySubscriptionId || !data.shopifyCustomerId) {
        throw new Error('Missing required subscription fields');
      }

      // Validate date ranges
      if (data.endDate && data.startDate && data.endDate < data.startDate) {
        throw new Error('End date cannot be before start date');
      }

      // Initialize entity with provided data
      Object.assign(this, {
        ...data,
        startDate: data.startDate || new Date(),
        auditLogs: [],
        status: data.status || SubscriptionStatus.PENDING,
        autoRenew: data.autoRenew ?? true
      });
    }
  }

  /**
   * Converts subscription entity to JSON representation with formatted dates
   * @returns Formatted subscription object
   */
  toJSON(): Record<string, any> {
    const {
      id,
      userId,
      plan,
      status,
      billingCycle,
      startDate,
      endDate,
      autoRenew,
      shopifySubscriptionId,
      lastBillingDate,
      nextBillingDate,
      createdAt,
      updatedAt
    } = this;

    return {
      id,
      userId,
      plan,
      status,
      billingCycle,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
      autoRenew,
      shopifySubscriptionId,
      lastBillingDate: lastBillingDate?.toISOString(),
      nextBillingDate: nextBillingDate?.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    };
  }

  /**
   * Records an audit log entry for subscription changes
   * @param event - Audit event type
   * @param changes - Changes made to subscription
   * @param userId - ID of user making changes
   */
  logAuditEvent(event: string, changes: Record<string, any>, userId: string): void {
    const auditEntry: AuditLogEntry = {
      eventType: event,
      severity: 'INFO',
      userId,
      resourceId: this.id,
      resourceType: 'subscription',
      ipAddress: '', // To be set by service layer
      userAgent: '', // To be set by service layer
      details: changes,
      timestamp: new Date()
    };

    this.auditLogs.push(auditEntry);
  }

  /**
   * Validates subscription data integrity
   * @returns boolean indicating validation status
   */
  validateSubscription(): boolean {
    // Validate required fields
    if (!this.userId || !this.shopifySubscriptionId || !this.shopifyCustomerId) {
      return false;
    }

    // Validate date ranges
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
      return false;
    }

    // Validate billing dates
    if (this.lastBillingDate && this.nextBillingDate && this.lastBillingDate > this.nextBillingDate) {
      return false;
    }

    // Validate status transitions
    if (this.status === SubscriptionStatus.CANCELLED && this.autoRenew) {
      return false;
    }

    return true;
  }

  /**
   * Lifecycle hook to validate subscription before updates
   */
  @BeforeUpdate()
  async validateBeforeUpdate(): Promise<void> {
    if (!this.validateSubscription()) {
      throw new Error('Invalid subscription data');
    }
  }

  /**
   * Lifecycle hook to handle post-update operations
   */
  @AfterUpdate()
  async handlePostUpdate(): Promise<void> {
    // Handle status transitions
    if (this.status === SubscriptionStatus.EXPIRED && this.autoRenew) {
      this.autoRenew = false;
    }

    // Update billing dates for active subscriptions
    if (this.status === SubscriptionStatus.ACTIVE && !this.nextBillingDate) {
      this.nextBillingDate = new Date(this.startDate);
      this.nextBillingDate.setMonth(this.nextBillingDate.getMonth() + 
        (this.billingCycle === BillingCycle.MONTHLY ? 1 : 12));
    }
  }
}