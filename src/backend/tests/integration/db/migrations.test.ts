// @package jest v29.6.1
import { up as initialSchemaUp, down as initialSchemaDown } from '../../../src/db/migrations/001_initial_schema';
import { up as delegatePermissionsUp, down as delegatePermissionsDown } from '../../../src/db/migrations/002_add_delegate_permissions';
import { up as auditLogsUp, down as auditLogsDown } from '../../../src/db/migrations/003_add_audit_logs';
import { initializeDatabase } from '../../../src/config/database';
import { logInfo, logError } from '../../../src/utils/logger.util';

/**
 * Human Tasks:
 * 1. Ensure test database is configured separately from production database
 * 2. Verify that test database user has sufficient privileges to create/drop tables
 * 3. Set up automated cleanup of test database after test runs
 * 4. Configure CI/CD pipeline to run migration tests before deployment
 */

describe('Database Migrations Integration Tests', () => {
  let queryInterface: any;
  let sequelize: any;

  beforeAll(async () => {
    try {
      // Initialize test database connection
      const dbConnection = initializeDatabase();
      sequelize = dbConnection;
      queryInterface = sequelize.getQueryInterface();
      
      logInfo('Test database connection initialized');
    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to initialize test database connection');
    }
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
    logInfo('Test database connection closed');
  });

  /**
   * Test suite for initial schema migration
   * Requirements Addressed:
   * - Database Migration Testing (Technical Specifications/2.3 Component Details/Backend Services)
   */
  describe('001_initial_schema Migration', () => {
    it('should successfully apply and rollback initial schema migration', async () => {
      try {
        // Apply migration
        logInfo('Applying initial schema migration');
        await initialSchemaUp(queryInterface, sequelize);

        // Verify tables were created
        const tables = await queryInterface.showAllTables();
        expect(tables).toContain('users');
        expect(tables).toContain('documents');
        expect(tables).toContain('delegates');
        expect(tables).toContain('subscriptions');
        expect(tables).toContain('permissions');
        expect(tables).toContain('audit_logs');

        // Verify indexes for users table
        const userIndexes = await queryInterface.showIndex('users');
        expect(userIndexes.some((idx: any) => idx.fields[0].attribute === 'email')).toBeTruthy();
        expect(userIndexes.some((idx: any) => idx.fields[0].attribute === 'role')).toBeTruthy();

        // Rollback migration
        logInfo('Rolling back initial schema migration');
        await initialSchemaDown(queryInterface);

        // Verify tables were dropped
        const tablesAfterRollback = await queryInterface.showAllTables();
        expect(tablesAfterRollback).not.toContain('users');
        expect(tablesAfterRollback).not.toContain('documents');
        expect(tablesAfterRollback).not.toContain('delegates');
        expect(tablesAfterRollback).not.toContain('subscriptions');
        expect(tablesAfterRollback).not.toContain('permissions');
        expect(tablesAfterRollback).not.toContain('audit_logs');

      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });
  });

  /**
   * Test suite for delegate permissions migration
   * Requirements Addressed:
   * - Database Migration Testing (Technical Specifications/2.3 Component Details/Backend Services)
   */
  describe('002_add_delegate_permissions Migration', () => {
    beforeEach(async () => {
      // Apply initial schema as prerequisite
      await initialSchemaUp(queryInterface, sequelize);
    });

    afterEach(async () => {
      // Clean up all migrations
      await initialSchemaDown(queryInterface);
    });

    it('should successfully apply and rollback delegate permissions migration', async () => {
      try {
        // Apply migration
        logInfo('Applying delegate permissions migration');
        await delegatePermissionsUp(queryInterface, sequelize);

        // Verify delegate_permissions table was created
        const tables = await queryInterface.showAllTables();
        expect(tables).toContain('delegate_permissions');

        // Verify indexes
        const indexes = await queryInterface.showIndex('delegate_permissions');
        expect(indexes.some((idx: any) => idx.name === 'idx_delegate_permissions_delegate')).toBeTruthy();
        expect(indexes.some((idx: any) => idx.name === 'idx_delegate_permissions_permission')).toBeTruthy();
        expect(indexes.some((idx: any) => idx.name === 'idx_delegate_permissions_resource_access')).toBeTruthy();

        // Rollback migration
        logInfo('Rolling back delegate permissions migration');
        await delegatePermissionsDown(queryInterface);

        // Verify table was dropped
        const tablesAfterRollback = await queryInterface.showAllTables();
        expect(tablesAfterRollback).not.toContain('delegate_permissions');

      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });
  });

  /**
   * Test suite for audit logs migration
   * Requirements Addressed:
   * - Database Migration Testing (Technical Specifications/2.3 Component Details/Backend Services)
   */
  describe('003_add_audit_logs Migration', () => {
    beforeEach(async () => {
      // Apply prerequisite migrations
      await initialSchemaUp(queryInterface, sequelize);
      await delegatePermissionsUp(queryInterface, sequelize);
    });

    afterEach(async () => {
      // Clean up all migrations in reverse order
      await delegatePermissionsDown(queryInterface);
      await initialSchemaDown(queryInterface);
    });

    it('should successfully apply and rollback audit logs migration', async () => {
      try {
        // Apply migration
        logInfo('Applying audit logs migration');
        await auditLogsUp(queryInterface, sequelize);

        // Verify audit_logs table structure
        const tableInfo = await queryInterface.describeTable('audit_logs');
        expect(tableInfo).toHaveProperty('id');
        expect(tableInfo).toHaveProperty('userId');
        expect(tableInfo).toHaveProperty('action');
        expect(tableInfo).toHaveProperty('timestamp');
        expect(tableInfo).toHaveProperty('details');
        expect(tableInfo).toHaveProperty('severity');
        expect(tableInfo).toHaveProperty('status');
        expect(tableInfo).toHaveProperty('metadata');

        // Verify indexes
        const indexes = await queryInterface.showIndex('audit_logs');
        expect(indexes.some((idx: any) => idx.name === 'idx_audit_timestamp_user')).toBeTruthy();
        expect(indexes.some((idx: any) => idx.name === 'idx_audit_action_severity')).toBeTruthy();
        expect(indexes.some((idx: any) => idx.name === 'idx_audit_request')).toBeTruthy();
        expect(indexes.some((idx: any) => idx.name === 'idx_audit_status')).toBeTruthy();
        expect(indexes.some((idx: any) => idx.name === 'idx_audit_timestamp')).toBeTruthy();

        // Rollback migration
        logInfo('Rolling back audit logs migration');
        await auditLogsDown(queryInterface);

        // Verify table was dropped
        const tablesAfterRollback = await queryInterface.showAllTables();
        expect(tablesAfterRollback).not.toContain('audit_logs');

      } catch (error) {
        logError(error as Error);
        throw error;
      }
    });
  });
});