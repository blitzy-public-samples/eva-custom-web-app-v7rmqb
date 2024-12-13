// @ts-check
import { describe, beforeEach, afterEach, it, expect } from 'jest'; // Version: ^29.0.0
import { DataSource, QueryRunner } from 'typeorm'; // Version: ^0.3.0
import { InitialSchemaMigration } from '../../../src/db/migrations/001_initial_schema';
import { AddDelegatePermissions } from '../../../src/db/migrations/002_add_delegate_permissions';
import { AddAuditLogs } from '../../../src/db/migrations/003_add_audit_logs';
import { UserModel } from '../../../src/db/models/user.model';
import { ResourceType, AccessLevel } from '../../../src/types/permission.types';
import { AuditEventType, AuditSeverity } from '../../../src/types/audit.types';

/**
 * Sets up test database with proper security configurations
 * @returns Promise<DataSource> Configured TypeORM DataSource
 */
async function setupTestDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
    synchronize: false,
    logging: false,
    entities: [],
    migrations: [
      InitialSchemaMigration,
      AddDelegatePermissions,
      AddAuditLogs
    ]
  });

  await dataSource.initialize();
  return dataSource;
}

/**
 * Performs secure cleanup of test database
 * @param dataSource TypeORM DataSource to clean up
 */
async function cleanupTestDatabase(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // Drop tables in reverse order to handle dependencies
    await queryRunner.query('DROP TABLE IF EXISTS audit_logs CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS permissions CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS delegates CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS documents CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS subscriptions CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS users CASCADE');

    // Drop custom types
    await queryRunner.query('DROP TYPE IF EXISTS audit_event_type');
    await queryRunner.query('DROP TYPE IF EXISTS audit_severity');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

describe('Database Migrations Integration Tests', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    dataSource = await setupTestDatabase();
    queryRunner = dataSource.createQueryRunner();
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('001_initial_schema Migration', () => {
    it('should create all required tables with proper constraints', async () => {
      // Run initial schema migration
      const migration = new InitialSchemaMigration();
      await migration.up(queryRunner);

      // Verify users table
      const usersTable = await queryRunner.getTable('users');
      expect(usersTable).toBeDefined();
      expect(usersTable?.findColumnByName('id')?.isPrimary).toBe(true);
      expect(usersTable?.findColumnByName('email')?.isUnique).toBe(true);
      expect(usersTable?.findColumnByName('profile')?.type).toBe('jsonb');

      // Verify documents table
      const documentsTable = await queryRunner.getTable('documents');
      expect(documentsTable).toBeDefined();
      expect(documentsTable?.findColumnByName('user_id')?.foreignKeys.length).toBe(1);
      expect(documentsTable?.findColumnByName('storage_details')?.type).toBe('jsonb');

      // Verify indexes for performance
      const userIndexes = await queryRunner.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'users'"
      );
      expect(userIndexes).toContainEqual(expect.objectContaining({ indexname: 'idx_users_email' }));
      expect(userIndexes).toContainEqual(expect.objectContaining({ indexname: 'idx_users_role' }));

      // Test data encryption
      const encryptionTest = await UserModel.validateEncryption(queryRunner);
      expect(encryptionTest.isEncrypted).toBe(true);
      expect(encryptionTest.algorithm).toBe('AES-256-GCM');

      // Test data masking
      const maskingTest = await UserModel.validateDataMasking(queryRunner);
      expect(maskingTest.isMasked).toBe(true);
      expect(maskingTest.maskedFields).toContain('phoneNumber');
    });

    it('should properly rollback all schema changes', async () => {
      // Run migration up and down
      const migration = new InitialSchemaMigration();
      await migration.up(queryRunner);
      await migration.down(queryRunner);

      // Verify all tables are dropped
      const tables = await queryRunner.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      );
      expect(tables).toHaveLength(0);
    });
  });

  describe('002_add_delegate_permissions Migration', () => {
    it('should create permissions table with proper RBAC structure', async () => {
      // Run required migrations
      const initialMigration = new InitialSchemaMigration();
      const permissionsMigration = new AddDelegatePermissions();
      await initialMigration.up(queryRunner);
      await permissionsMigration.up(queryRunner);

      // Verify permissions table
      const permissionsTable = await queryRunner.getTable('permissions');
      expect(permissionsTable).toBeDefined();
      expect(permissionsTable?.findColumnByName('delegate_id')?.foreignKeys.length).toBe(1);
      
      // Verify resource type constraints
      const resourceTypeCheck = await queryRunner.query(`
        SELECT conname, consrc 
        FROM pg_constraint 
        WHERE conrelid = 'permissions'::regclass AND contype = 'c'
      `);
      expect(resourceTypeCheck).toContainEqual(
        expect.objectContaining({
          consrc: expect.stringContaining(ResourceType.PERSONAL_INFO)
        })
      );

      // Test permission inheritance
      const inheritanceTest = await permissionsMigration.validatePermissions(queryRunner);
      expect(inheritanceTest.hasInheritance).toBe(true);
      expect(inheritanceTest.inheritanceDepth).toBe(2);
    });

    it('should enforce proper access control constraints', async () => {
      // Run migrations
      await new InitialSchemaMigration().up(queryRunner);
      await new AddDelegatePermissions().up(queryRunner);

      // Test access level constraints
      await expect(queryRunner.query(`
        INSERT INTO permissions (delegate_id, resource_type, access_level)
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          '${ResourceType.MEDICAL_DATA}',
          'INVALID_LEVEL'
        )
      `)).rejects.toThrow();

      // Verify cascading deletes
      await queryRunner.query(`
        DELETE FROM delegates 
        WHERE id IN (
          SELECT delegate_id FROM permissions
        )
      `);
      
      const remainingPermissions = await queryRunner.query(
        'SELECT COUNT(*) FROM permissions'
      );
      expect(remainingPermissions[0].count).toBe('0');
    });
  });

  describe('003_add_audit_logs Migration', () => {
    it('should create audit logs table with proper compliance structure', async () => {
      // Run all migrations
      await new InitialSchemaMigration().up(queryRunner);
      await new AddDelegatePermissions().up(queryRunner);
      await new AddAuditLogs().up(queryRunner);

      // Verify audit_logs table
      const auditTable = await queryRunner.getTable('audit_logs');
      expect(auditTable).toBeDefined();
      expect(auditTable?.findColumnByName('event_type')?.type).toBe('audit_event_type');
      expect(auditTable?.findColumnByName('severity')?.type).toBe('audit_severity');

      // Test enum types
      const eventTypes = await queryRunner.query(
        "SELECT enum_range(NULL::audit_event_type)"
      );
      expect(eventTypes[0].enum_range).toContain(AuditEventType.DOCUMENT_ACCESS);

      // Verify indexes for audit queries
      const auditIndexes = await queryRunner.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs'"
      );
      expect(auditIndexes).toContainEqual(
        expect.objectContaining({ indexname: 'idx_audit_logs_composite' })
      );

      // Test audit schema validation
      const validationResult = await new AddAuditLogs().validateAuditSchema(queryRunner);
      expect(validationResult.isCompliant).toBe(true);
      expect(validationResult.standards).toContain('PIPEDA');
      expect(validationResult.standards).toContain('HIPAA');
    });

    it('should properly handle audit log retention', async () => {
      // Run migrations
      await new InitialSchemaMigration().up(queryRunner);
      await new AddDelegatePermissions().up(queryRunner);
      await new AddAuditLogs().up(queryRunner);

      // Insert test audit log
      await queryRunner.query(`
        INSERT INTO audit_logs (
          event_type, severity, resource_type, ip_address, user_agent, details
        ) VALUES (
          '${AuditEventType.DOCUMENT_ACCESS}',
          '${AuditSeverity.INFO}',
          'document',
          '127.0.0.1',
          'test-agent',
          '{"test": true}'
        )
      `);

      // Verify retention policy
      const retentionCheck = await queryRunner.query(`
        SELECT * FROM audit_logs 
        WHERE created_at < NOW() - INTERVAL '7 years'
      `);
      expect(retentionCheck).toHaveLength(0);
    });
  });
});