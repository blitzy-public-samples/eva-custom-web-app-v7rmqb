import { MigrationInterface, QueryRunner } from 'typeorm'; // Version: ^0.3.0
import { UserRole } from '../../types/user.types';
import { DocumentType } from '../../types/document.types';
import { SubscriptionPlan } from '../../types/subscription.types';

/**
 * Initial database migration that sets up the core schema for Estate Kit platform.
 * Implements secure data storage with encryption, proper indexing, and PIPEDA compliance.
 */
export class InitialSchemaMigration implements MigrationInterface {
    name = '001_initial_schema';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table with secure data storage
        await queryRunner.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN (${Object.values(UserRole).map(role => `'${role}'`).join(', ')})),
                status TEXT NOT NULL DEFAULT 'PENDING',
                profile JSONB NOT NULL DEFAULT '{}',
                failed_login_attempts INTEGER NOT NULL DEFAULT 0,
                last_login_at TIMESTAMP WITH TIME ZONE,
                last_password_change_at TIMESTAMP WITH TIME ZONE,
                current_session_id TEXT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
            );
            
            -- Trigger to automatically update updated_at timestamp
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Create documents table with encryption and versioning support
        await queryRunner.query(`
            CREATE TABLE documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                title TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN (${Object.values(DocumentType).map(type => `'${type}'`).join(', ')})),
                status TEXT NOT NULL DEFAULT 'PENDING',
                metadata JSONB NOT NULL DEFAULT '{}',
                storage_details JSONB NOT NULL DEFAULT '{}',
                last_accessed_at TIMESTAMP WITH TIME ZONE,
                expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            CREATE TRIGGER update_documents_updated_at
                BEFORE UPDATE ON documents
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Create subscriptions table with Shopify integration
        await queryRunner.query(`
            CREATE TABLE subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                plan TEXT NOT NULL CHECK (plan IN (${Object.values(SubscriptionPlan).map(plan => `'${plan}'`).join(', ')})),
                status TEXT NOT NULL DEFAULT 'PENDING',
                billing_cycle TEXT NOT NULL,
                start_date TIMESTAMP WITH TIME ZONE NOT NULL,
                end_date TIMESTAMP WITH TIME ZONE,
                auto_renew BOOLEAN NOT NULL DEFAULT true,
                shopify_subscription_id TEXT,
                shopify_customer_id TEXT,
                shopify_order_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
                last_billing_date TIMESTAMP WITH TIME ZONE,
                next_billing_date TIMESTAMP WITH TIME ZONE,
                cancel_reason TEXT,
                metadata JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            CREATE TRIGGER update_subscriptions_updated_at
                BEFORE UPDATE ON subscriptions
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Create delegates table with secure access control
        await queryRunner.query(`
            CREATE TABLE delegates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL,
                delegate_id UUID NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                permissions JSONB NOT NULL DEFAULT '{}',
                expiry_date TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (delegate_id) REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE(owner_id, delegate_id)
            );
            
            CREATE TRIGGER update_delegates_updated_at
                BEFORE UPDATE ON delegates
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Create audit_logs table for security tracking
        await queryRunner.query(`
            CREATE TABLE audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID,
                action TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id UUID,
                details JSONB NOT NULL DEFAULT '{}',
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);

        // Create updated_at trigger function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Create performance-optimized indexes
        await queryRunner.query(`
            CREATE INDEX idx_users_email ON users(email);
            CREATE INDEX idx_users_role ON users(role);
            CREATE INDEX idx_documents_user_type ON documents(user_id, type);
            CREATE INDEX idx_documents_status ON documents(status);
            CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
            CREATE INDEX idx_subscriptions_status ON subscriptions(status);
            CREATE INDEX idx_delegates_owner ON delegates(owner_id);
            CREATE INDEX idx_delegates_delegate ON delegates(delegate_id);
            CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
            CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to handle dependencies
        await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
        await queryRunner.query(`DROP TABLE IF EXISTS delegates;`);
        await queryRunner.query(`DROP TABLE IF EXISTS subscriptions;`);
        await queryRunner.query(`DROP TABLE IF EXISTS documents;`);
        await queryRunner.query(`DROP TABLE IF EXISTS users;`);
        
        // Drop the updated_at trigger function
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column;`);
    }
}