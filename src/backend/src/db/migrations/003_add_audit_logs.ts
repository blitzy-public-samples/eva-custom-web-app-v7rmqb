/**
 * Migration to create audit logs table for PIPEDA and HIPAA compliant logging
 * Implements comprehensive audit trail with optimized indexing for security monitoring
 * @version 1.0.0
 */

import { MigrationInterface, QueryRunner } from 'typeorm';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

export class AddAuditLogs implements MigrationInterface {
  name = '003_add_audit_logs';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types in the database for event_type and severity
    await queryRunner.query(`
      CREATE TYPE audit_event_type AS ENUM (
        'USER_LOGIN', 'USER_LOGOUT', 'DOCUMENT_UPLOAD', 'DOCUMENT_ACCESS',
        'DELEGATE_INVITE', 'DELEGATE_ACCESS', 'PERMISSION_CHANGE', 'SUBSCRIPTION_CHANGE'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE audit_severity AS ENUM (
        'INFO', 'WARNING', 'ERROR', 'CRITICAL'
      )
    `);

    // Create audit_logs table with comprehensive columns for compliance
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_type" audit_event_type NOT NULL,
        "severity" audit_severity NOT NULL,
        "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "resource_id" UUID,
        "resource_type" VARCHAR(50) NOT NULL,
        "ip_address" VARCHAR(45) NOT NULL,
        "user_agent" VARCHAR(255) NOT NULL,
        "details" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        
        CONSTRAINT "audit_logs_event_type_check" 
          CHECK (event_type::text = ANY (enum_range(NULL::audit_event_type)::text[])),
        CONSTRAINT "audit_logs_severity_check" 
          CHECK (severity::text = ANY (enum_range(NULL::audit_severity)::text[]))
      )
    `);

    // Add table comment for documentation
    await queryRunner.query(`
      COMMENT ON TABLE "audit_logs" IS 
      'Audit logs for PIPEDA and HIPAA compliance tracking user actions and system events'
    `);

    // Create optimized indexes for efficient querying
    
    // Composite index for common query patterns
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_composite" 
      ON "audit_logs" (event_type, severity, user_id, created_at DESC)
    `);

    // Index for resource-based lookups
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_resource" 
      ON "audit_logs" (resource_id, resource_type)
    `);

    // Partial index for high-severity events
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_high_severity" 
      ON "audit_logs" (created_at DESC)
      WHERE severity = 'CRITICAL'
    `);

    // Index for temporal queries
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_created_at" 
      ON "audit_logs" (created_at DESC)
    `);

    // Add column comments for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "audit_logs"."event_type" IS 'Type of audited event for security monitoring';
      COMMENT ON COLUMN "audit_logs"."severity" IS 'Severity level for risk assessment';
      COMMENT ON COLUMN "audit_logs"."user_id" IS 'Reference to user who performed the action';
      COMMENT ON COLUMN "audit_logs"."resource_id" IS 'UUID of affected resource';
      COMMENT ON COLUMN "audit_logs"."resource_type" IS 'Type of resource being accessed/modified';
      COMMENT ON COLUMN "audit_logs"."ip_address" IS 'Origin IP address of the request';
      COMMENT ON COLUMN "audit_logs"."user_agent" IS 'Client user agent string';
      COMMENT ON COLUMN "audit_logs"."details" IS 'Additional event-specific metadata in JSONB format';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_composite"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_resource"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_high_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_created_at"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS audit_event_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_severity`);
  }
}