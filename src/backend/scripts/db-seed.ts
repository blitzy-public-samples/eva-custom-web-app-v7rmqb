// @ts-check
import { dataSource } from '../config/database';
import seedProvinces from '../db/seeders/provinces.seeder';
import seedRoles from '../db/seeders/roles.seeder';
import winston from 'winston'; // ^3.8.0

// Initialize logger for seeding operations
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'db-seed-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'db-seed.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Initializes database connection and prepares for seeding operations
 * @throws Error if initialization fails
 */
async function initializeSeeding(): Promise<void> {
  try {
    // Validate environment
    if (!process.env.NODE_ENV) {
      throw new Error('NODE_ENV must be set');
    }

    // Validate database schema version
    const requiredSchemaVersion = process.env.DB_SCHEMA_VERSION || '2024.1';
    logger.info('Initializing database seeding', {
      environment: process.env.NODE_ENV,
      schemaVersion: requiredSchemaVersion,
      timestamp: new Date().toISOString()
    });

    // Initialize database connection
    await dataSource.initialize();
    logger.info('Database connection established');

    // Set session parameters for seeding
    await dataSource.query(`
      SET session_replication_role = 'replica';
      SET constraint_exclusion = on;
      SET statement_timeout = '300s';
    `);

  } catch (error) {
    logger.error('Seeding initialization failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Main function that orchestrates the seeding of all required initial data
 * Implements transaction management and comprehensive error handling
 */
async function seedDatabase(): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    // Start transaction
    await queryRunner.startTransaction('SERIALIZABLE');
    logger.info('Starting database seeding transaction');

    // Create savepoint for partial rollbacks
    await queryRunner.query('SAVEPOINT seeding_start');

    // Seed provinces
    try {
      logger.info('Seeding provinces data');
      await seedProvinces();
      await queryRunner.query('SAVEPOINT after_provinces');
      logger.info('Provinces seeding completed successfully');
    } catch (error) {
      logger.error('Provinces seeding failed', { error });
      await queryRunner.query('ROLLBACK TO SAVEPOINT seeding_start');
      throw error;
    }

    // Seed roles and permissions
    try {
      logger.info('Seeding roles and permissions');
      await seedRoles(dataSource);
      await queryRunner.query('SAVEPOINT after_roles');
      logger.info('Roles and permissions seeding completed successfully');
    } catch (error) {
      logger.error('Roles seeding failed', { error });
      await queryRunner.query('ROLLBACK TO SAVEPOINT after_provinces');
      throw error;
    }

    // Verify seeding results
    const verificationQueries = [
      'SELECT COUNT(*) FROM provinces',
      'SELECT COUNT(*) FROM roles',
      'SELECT COUNT(*) FROM role_permissions'
    ];

    for (const query of verificationQueries) {
      const [{ count }] = await queryRunner.query(query);
      if (parseInt(count) === 0) {
        throw new Error(`Verification failed: ${query} returned no records`);
      }
    }

    // Commit transaction if all operations successful
    await queryRunner.commitTransaction();
    logger.info('Database seeding completed successfully');

  } catch (error) {
    // Rollback transaction on any error
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    
    logger.error('Database seeding failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;

  } finally {
    // Release query runner
    await queryRunner.release();
  }
}

/**
 * Entry point function that runs the seeding process
 * Implements comprehensive error handling and reporting
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  const timeout = parseInt(process.env.SEEDING_TIMEOUT || '300000', 10); // 5 minutes default

  try {
    // Initialize seeding environment
    await initializeSeeding();

    // Set timeout for seeding operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Seeding timeout after ${timeout}ms`));
      }, timeout);
    });

    // Run seeding with timeout
    await Promise.race([
      seedDatabase(),
      timeoutPromise
    ]);

    const duration = Date.now() - startTime;
    logger.info('Seeding process completed', {
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Seeding process failed', {
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    process.exit(1);

  } finally {
    // Cleanup
    await dataSource.destroy();
  }
}

// Run seeding process
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error during seeding', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  });
}

export { initializeSeeding, seedDatabase, main };