/**
 * Estate Kit - Database Migration Script
 * Version: 1.0.0
 * 
 * This script handles the execution of database migrations for the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Database Initialization and Updates (Technical Specifications/2.3 Component Details/Backend)
 *   Ensures the database schema is initialized and updated as per the system requirements.
 * - Audit Logging (Technical Specifications/1.3 Scope/In-Scope)
 *   Tracks schema changes and ensures compliance with audit requirements.
 * 
 * Human Tasks:
 * 1. Ensure database credentials are properly configured in environment variables
 * 2. Verify database backup exists before running migrations
 * 3. Review migration logs after execution
 * 4. Update application version number if needed
 */

// yargs v17.7.2
import yargs from 'yargs';
import { initializeDatabase } from '../src/config/database';
import { logInfo, logError } from '../src/utils/logger.util';
import { 
  up as initialSchemaUp,
  down as initialSchemaDown 
} from '../src/db/migrations/001_initial_schema';
import { 
  up as delegatePermissionsUp,
  down as delegatePermissionsDown 
} from '../src/db/migrations/002_add_delegate_permissions';
import { 
  up as auditLogsUp,
  down as auditLogsDown 
} from '../src/db/migrations/003_add_audit_logs';

/**
 * Executes database migrations based on command-line arguments
 * Implements requirement: Database Initialization and Updates
 */
const runMigrations = async (): Promise<void> => {
  try {
    // Parse command-line arguments
    const argv = await yargs
      .option('action', {
        alias: 'a',
        description: 'Migration action to perform',
        choices: ['up', 'down'],
        required: true,
        type: 'string'
      })
      .option('version', {
        alias: 'v',
        description: 'Target migration version',
        type: 'number',
        default: 3
      })
      .help()
      .argv;

    // Initialize database connection
    const sequelize = initializeDatabase();

    // Log migration start
    logInfo(`Starting database migration: action=${argv.action}, version=${argv.version}`);

    // Execute migrations based on action and version
    if (argv.action === 'up') {
      if (argv.version >= 1) {
        logInfo('Executing migration: 001_initial_schema');
        await initialSchemaUp(sequelize.getQueryInterface(), sequelize);
      }
      if (argv.version >= 2) {
        logInfo('Executing migration: 002_add_delegate_permissions');
        await delegatePermissionsUp(sequelize.getQueryInterface(), sequelize);
      }
      if (argv.version >= 3) {
        logInfo('Executing migration: 003_add_audit_logs');
        await auditLogsUp(sequelize.getQueryInterface(), sequelize);
      }
    } else {
      // Execute down migrations in reverse order
      if (argv.version < 3) {
        logInfo('Reverting migration: 003_add_audit_logs');
        await auditLogsDown(sequelize.getQueryInterface());
      }
      if (argv.version < 2) {
        logInfo('Reverting migration: 002_add_delegate_permissions');
        await delegatePermissionsDown(sequelize.getQueryInterface());
      }
      if (argv.version < 1) {
        logInfo('Reverting migration: 001_initial_schema');
        await initialSchemaDown(sequelize.getQueryInterface());
      }
    }

    // Log successful completion
    logInfo('Database migration completed successfully');

    // Close database connection
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown migration error');
    logError(err);
    process.exit(1);
  }
};

// Execute migrations
runMigrations();

export default runMigrations;
```

This implementation:

1. Uses yargs to parse command-line arguments for migration control
2. Implements proper error handling and logging
3. Executes migrations in the correct order based on version numbers
4. Supports both up and down migrations
5. Properly closes database connections
6. Includes detailed logging for tracking migration progress
7. Follows TypeScript best practices and type safety
8. Addresses the specified requirements for database initialization and audit logging
9. Includes human tasks as comments for manual verification steps
10. Uses proper relative imports for all dependencies

The script can be run with commands like:
```bash
# Run all migrations up
npm run db-migrate -- --action up

# Revert to a specific version
npm run db-migrate -- --action down --version 1

# Show help
npm run db-migrate -- --help