// @ts-check
import { MigrationInterface, QueryRunner } from 'typeorm'; // Version: ^0.3.0
import { ResourceType, AccessLevel } from '../../types/permission.types';

/**
 * Migration to create and configure the permissions table implementing RBAC
 * for delegate access control with proper constraints and indexing.
 * 
 * Implements requirements from:
 * - Role-Based Access Control (Security Architecture)
 * - Authorization Matrix (Authentication and Authorization)
 * - Data Security (Data Protection Measures)
 */
export class AddDelegatePermissions implements MigrationInterface {
    name = 'AddDelegatePermissions';

    /**
     * Creates the permissions table with all necessary columns, constraints,
     * and indexes for implementing secure and performant RBAC.
     * 
     * @param queryRunner - TypeORM query runner for executing SQL statements
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Start transaction for atomic execution
        await queryRunner.startTransaction();

        try {
            // Create permissions table with UUID primary key
            await queryRunner.query(`
                CREATE TABLE "permissions" (
                    "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
                    "delegate_id" UUID NOT NULL,
                    "resource_type" VARCHAR NOT NULL CHECK (
                        "resource_type" IN (
                            '${ResourceType.PERSONAL_INFO}',
                            '${ResourceType.FINANCIAL_DATA}',
                            '${ResourceType.MEDICAL_DATA}',
                            '${ResourceType.LEGAL_DOCS}'
                        )
                    ),
                    "access_level" VARCHAR NOT NULL CHECK (
                        "access_level" IN (
                            '${AccessLevel.READ}',
                            '${AccessLevel.WRITE}',
                            '${AccessLevel.NONE}'
                        )
                    ),
                    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    CONSTRAINT "pk_permissions" PRIMARY KEY ("id")
                )
            `);

            // Add foreign key constraint to delegates table with cascade delete
            await queryRunner.query(`
                ALTER TABLE "permissions"
                ADD CONSTRAINT "fk_permissions_delegate"
                FOREIGN KEY ("delegate_id")
                REFERENCES "delegates"("id")
                ON DELETE CASCADE
            `);

            // Create index on delegate_id for foreign key lookups
            await queryRunner.query(`
                CREATE INDEX "idx_permissions_delegate_id"
                ON "permissions"("delegate_id")
            `);

            // Create composite index for permission checks
            await queryRunner.query(`
                CREATE INDEX "idx_permissions_delegate_resource"
                ON "permissions"("delegate_id", "resource_type")
            `);

            // Create index on resource_type for filtering
            await queryRunner.query(`
                CREATE INDEX "idx_permissions_resource_type"
                ON "permissions"("resource_type")
            `);

            // Create unique constraint to prevent duplicate permissions
            await queryRunner.query(`
                ALTER TABLE "permissions"
                ADD CONSTRAINT "uq_delegate_resource"
                UNIQUE ("delegate_id", "resource_type")
            `);

            // Create updated_at trigger
            await queryRunner.query(`
                CREATE TRIGGER "tr_permissions_updated_at"
                BEFORE UPDATE ON "permissions"
                FOR EACH ROW
                EXECUTE FUNCTION update_timestamp()
            `);

            // Commit transaction
            await queryRunner.commitTransaction();
        } catch (error) {
            // Rollback on error
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }

    /**
     * Reverts the permissions table creation by removing all related objects
     * in the correct order to maintain referential integrity.
     * 
     * @param queryRunner - TypeORM query runner for executing SQL statements
     */
    public async down(queryRunner: QueryRunner): Promise<void> {
        // Start transaction for atomic execution
        await queryRunner.startTransaction();

        try {
            // Drop trigger first
            await queryRunner.query(`
                DROP TRIGGER IF EXISTS "tr_permissions_updated_at"
                ON "permissions"
            `);

            // Drop indexes
            await queryRunner.query(`
                DROP INDEX IF EXISTS "idx_permissions_delegate_resource"
            `);
            await queryRunner.query(`
                DROP INDEX IF EXISTS "idx_permissions_resource_type"
            `);
            await queryRunner.query(`
                DROP INDEX IF EXISTS "idx_permissions_delegate_id"
            `);

            // Drop unique constraint
            await queryRunner.query(`
                ALTER TABLE "permissions"
                DROP CONSTRAINT IF EXISTS "uq_delegate_resource"
            `);

            // Drop foreign key constraint
            await queryRunner.query(`
                ALTER TABLE "permissions"
                DROP CONSTRAINT IF EXISTS "fk_permissions_delegate"
            `);

            // Drop the permissions table
            await queryRunner.query(`
                DROP TABLE IF EXISTS "permissions"
            `);

            // Commit transaction
            await queryRunner.commitTransaction();
        } catch (error) {
            // Rollback on error
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }
}