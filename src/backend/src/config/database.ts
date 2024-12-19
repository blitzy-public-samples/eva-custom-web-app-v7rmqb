// @ts-check
import { DataSource, DataSourceOptions } from 'typeorm'; // ^0.3.0
import UserModel from '../db/models/user.model';
import DocumentModel from '../db/models/document.model';
import winston from 'winston'; // ^3.8.0 - For comprehensive logging

// Initialize logger for database operations
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'database-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'database.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Validates required environment variables for database configuration
 * @throws Error if required variables are missing
 */
const validateEnvironmentVariables = (): void => {
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'SSL_CERT'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
};

/**
 * Generates TypeORM DataSource configuration with enhanced security and performance settings
 * @returns DataSourceOptions Configuration object for TypeORM
 */
export const getDataSourceOptions = (): DataSourceOptions => {
  validateEnvironmentVariables();

  const isProduction = process.env.NODE_ENV === 'production';

  // Base configuration
  const config: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    entities: [UserModel, DocumentModel],
    migrations: ['../db/migrations/*.ts'],
    subscribers: ['../db/subscribers/*.ts'],
    synchronize: false, // Disabled for production safety
    logging: !isProduction,
    logger: 'advanced-console',

    // Enhanced SSL configuration for security
    ssl: {
      ca: process.env.SSL_CERT,
      rejectUnauthorized: true
    },

    // Connection pool settings
    connectTimeoutMS: 20000,
    maxQueryExecutionTime: 10000,

    // Cache configuration for performance
    cache: {
      type: 'redis',
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: 0,
        duration: 60000 // 1 minute cache duration
      }
    },

    // Extra configuration for PostgreSQL
    extra: {
      max: 10,
      statement_timeout: 10000, // 10s query timeout
      idle_in_transaction_session_timeout: 60000, // 1m transaction timeout
      ssl: true
    }
  };

  return config;
};

/**
 * Initializes database connection with configured options and monitoring
 * @returns Promise<DataSource> Initialized database connection
 */
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    const options = getDataSourceOptions();
    const dataSource = new DataSource(options);

    // Initialize connection with retry logic
    let retries = 5;
    while (retries > 0) {
      try {
        await dataSource.initialize();
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        
        logger.warn(`Database connection failed, retrying... (${retries} attempts left)`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Set up connection monitoring
    dataSource.initialize().then(() => {
      logger.info('Database connected successfully', {
        timestamp: new Date().toISOString(),
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
      });
    });

    // Set up query performance monitoring using QueryRunner events
    if (process.env.NODE_ENV === 'production') {
      const queryRunner = dataSource.createQueryRunner();
      queryRunner.connection.driver.afterQueriesExecute = (queries: any[]) => {
        queries.forEach(query => {
          if (query.executionTime > 1000) { // Log slow queries (>1s)
            logger.warn('Slow query detected', {
              query: query.query,
              parameters: query.parameters,
              time: query.executionTime,
              timestamp: new Date().toISOString()
            });
          }
        });
      };
    }

    // Schedule maintenance tasks for production
    if (process.env.NODE_ENV === 'production') {
      setInterval(async () => {
        try {
          await dataSource.query('VACUUM ANALYZE');
          logger.info('Scheduled maintenance completed', {
            timestamp: new Date().toISOString(),
            operation: 'VACUUM ANALYZE'
          });
        } catch (error) {
          logger.error('Maintenance operation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }, 24 * 60 * 60 * 1000); // Daily maintenance
    }

    return dataSource;
  } catch (error) {
    logger.error('Failed to initialize database', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Export initialized DataSource instance
export const dataSource = new DataSource(getDataSourceOptions());