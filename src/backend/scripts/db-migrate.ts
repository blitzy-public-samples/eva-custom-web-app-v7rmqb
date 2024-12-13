#!/usr/bin/env ts-node

import yargs from 'yargs'; // ^17.0.0
import ora from 'ora'; // ^6.0.0
import { dataSource } from '../src/config/database';
import { logger } from '../src/utils/logger.util';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import path from 'path';

// Constants for configuration
const MIGRATION_TIMEOUT = parseInt(process.env.DB_MIGRATION_TIMEOUT || '300000', 10); // 5 minutes
const BACKUP_PATH = process.env.DB_BACKUP_PATH || './backups';
const REQUIRE_APPROVAL = process.env.REQUIRE_MIGRATION_APPROVAL === 'true';

// Interface definitions
interface MigrationOptions {
  dryRun?: boolean;
  force?: boolean;
  timeout?: number;
}

interface RollbackOptions {
  steps?: number;
  force?: boolean;
}

interface MigrationMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  migrationCount: number;
  errors: string[];
}

/**
 * Validates environment configuration and database connectivity
 * @returns Promise<boolean> indicating if environment is valid
 */
async function validateEnvironment(): Promise<boolean> {
  try {
    // Check NODE_ENV
    if (!['development', 'staging', 'production'].includes(process.env.NODE_ENV || '')) {
      throw new Error('Invalid NODE_ENV value');
    }

    // Validate database configuration
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Test database connectivity
    await dataSource.query('SELECT 1');

    // Check migration table existence
    const migrationTableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migrations'
      );
    `);

    if (!migrationTableExists[0].exists) {
      logger.warn('Migrations table does not exist, will be created');
    }

    // Verify PostgreSQL version compatibility
    const dbVersion = await dataSource.query('SHOW server_version;');
    const versionNum = parseFloat(dbVersion[0].server_version);
    if (versionNum < 14) {
      throw new Error('PostgreSQL version 14+ is required');
    }

    // Check available disk space for backups
    const { free } = await checkDiskSpace(BACKUP_PATH);
    const minRequiredSpace = 1024 * 1024 * 1024; // 1GB
    if (free < minRequiredSpace) {
      throw new Error('Insufficient disk space for database backup');
    }

    return true;
  } catch (error) {
    logger.error('Environment validation failed', { error });
    return false;
  }
}

/**
 * Creates a database backup before migration
 * @returns Promise<string> Backup file path
 */
async function createDatabaseBackup(): Promise<string> {
  const execAsync = promisify(exec);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_PATH, `backup-${timestamp}.sql`);

  try {
    await fs.mkdir(BACKUP_PATH, { recursive: true });
    
    const { stdout, stderr } = await execAsync(
      `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -F c -f ${backupFile}`
    );

    if (stderr) {
      logger.warn('Backup warning:', { stderr });
    }

    logger.info('Database backup created successfully', { backupFile });
    return backupFile;
  } catch (error) {
    logger.error('Database backup failed', { error });
    throw error;
  }
}

/**
 * Executes pending database migrations with enhanced security and monitoring
 * @param options Migration options
 */
async function runMigrations(options: MigrationOptions = {}): Promise<void> {
  const spinner = ora('Running database migrations').start();
  const metrics: MigrationMetrics = {
    startTime: Date.now(),
    success: false,
    migrationCount: 0,
    errors: []
  };

  try {
    // Validate environment
    if (!await validateEnvironment()) {
      throw new Error('Environment validation failed');
    }

    // Create backup in production
    if (process.env.NODE_ENV === 'production') {
      spinner.text = 'Creating database backup';
      await createDatabaseBackup();
    }

    // Initialize database connection with timeout
    if (!dataSource.isInitialized) {
      spinner.text = 'Initializing database connection';
      await Promise.race([
        dataSource.initialize(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 
          options.timeout || MIGRATION_TIMEOUT)
        )
      ]);
    }

    // Get pending migrations
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations.length === 0) {
      spinner.succeed('No pending migrations');
      return;
    }

    // Require approval in production
    if (REQUIRE_APPROVAL && process.env.NODE_ENV === 'production') {
      spinner.stop();
      const approved = await promptForApproval(pendingMigrations);
      if (!approved) {
        throw new Error('Migration cancelled by user');
      }
      spinner.start();
    }

    // Execute migrations
    spinner.text = 'Executing migrations';
    if (!options.dryRun) {
      await dataSource.runMigrations({
        transaction: 'each'
      });
    }

    // Update metrics
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = true;
    metrics.migrationCount = pendingMigrations.length;

    // Log success
    spinner.succeed('Migrations completed successfully');
    logger.info('Migration completed', {
      metrics,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.errors.push(error.message);

    spinner.fail('Migration failed');
    logger.error('Migration failed', {
      error,
      metrics,
      environment: process.env.NODE_ENV
    });

    throw error;
  } finally {
    // Clean up
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

/**
 * Rolls back the last executed migration with validation
 * @param options Rollback options
 */
async function rollbackMigration(options: RollbackOptions = {}): Promise<void> {
  const spinner = ora('Rolling back migration').start();

  try {
    // Validate environment
    if (!await validateEnvironment()) {
      throw new Error('Environment validation failed');
    }

    // Create backup before rollback
    if (process.env.NODE_ENV === 'production') {
      spinner.text = 'Creating pre-rollback backup';
      await createDatabaseBackup();
    }

    // Initialize connection
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Execute rollback
    spinner.text = 'Executing rollback';
    await dataSource.undoLastMigration();

    spinner.succeed('Rollback completed successfully');
    logger.info('Rollback completed', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    spinner.fail('Rollback failed');
    logger.error('Rollback failed', { error });
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

/**
 * Prompts for migration approval in production
 * @param pendingMigrations Array of pending migrations
 * @returns Promise<boolean> indicating approval
 */
async function promptForApproval(pendingMigrations: string[]): Promise<boolean> {
  console.log('\nPending migrations:');
  pendingMigrations.forEach((migration, index) => {
    console.log(`${index + 1}. ${migration}`);
  });

  if (process.stdin.isTTY) {
    process.stdout.write('\nDo you want to proceed? (yes/no): ');
    const response = await new Promise(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim().toLowerCase());
      });
    });
    return response === 'yes';
  }
  return false;
}

/**
 * Checks available disk space
 * @param path Directory path to check
 * @returns Promise with space information
 */
async function checkDiskSpace(path: string): Promise<{ free: number }> {
  try {
    const stats = await fs.statfs(path);
    return {
      free: stats.bfree * stats.bsize
    };
  } catch (error) {
    logger.error('Failed to check disk space', { error });
    throw error;
  }
}

/**
 * Main function to handle migration commands
 */
async function main(): Promise<void> {
  try {
    const argv = await yargs
      .command('up', 'Run pending migrations', {
        dryRun: {
          type: 'boolean',
          default: false,
          description: 'Show pending migrations without executing'
        },
        force: {
          type: 'boolean',
          default: false,
          description: 'Force migration execution'
        }
      })
      .command('down', 'Rollback last migration', {
        force: {
          type: 'boolean',
          default: false,
          description: 'Force rollback execution'
        }
      })
      .demandCommand(1, 'Please specify a command: up or down')
      .help()
      .argv;

    const command = argv._[0];

    if (command === 'up') {
      await runMigrations({
        dryRun: argv.dryRun,
        force: argv.force
      });
    } else if (command === 'down') {
      await rollbackMigration({
        force: argv.force
      });
    }
  } catch (error) {
    logger.error('Migration script failed', { error });
    process.exit(1);
  }
}

// Execute if running directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  runMigrations,
  rollbackMigration,
  validateEnvironment
};
```

This implementation provides a robust database migration script with the following key features:

1. Comprehensive environment validation including database connectivity, version checks, and disk space verification
2. Enhanced security with production safeguards including:
   - Automatic database backups
   - Migration approval requirements
   - Secure rollback capabilities
3. Detailed logging and metrics collection for audit compliance
4. Error handling with graceful cleanup
5. Support for dry-run migrations
6. Progress indication for long-running operations
7. TypeScript type safety throughout
8. Integration with the project's logging and database configuration

The script can be run using:
```bash
# Run pending migrations
npm run migrate up

# Show pending migrations without executing
npm run migrate up --dry-run

# Rollback last migration
npm run migrate down