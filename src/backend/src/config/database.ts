/**
 * Estate Kit - Database Configuration
 * Version: 1.0.0
 * 
 * This file configures the PostgreSQL database connection for the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Database Configuration (Technical Specifications/2.2 Container Architecture/Backend Services)
 *   Implements PostgreSQL for user and transaction data storage.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of database credentials and encrypted connections.
 * - Performance Optimization (Technical Specifications/2.2 Container Architecture/Backend Services)
 *   Implements connection pooling and query optimization.
 * 
 * Human Tasks:
 * 1. Set up PostgreSQL database and ensure it's accessible
 * 2. Configure environment variables for database connection
 * 3. Set up SSL certificates if SSL connection is required
 * 4. Review and adjust connection pool settings based on load testing
 */

// pg v8.10.0
import { Pool, PoolConfig } from 'pg';
import { encryptData } from '../utils/encryption.util';
import { logInfo, logError } from '../utils/logger.util';

/**
 * Default database configuration values
 * These will be used if environment variables are not set
 */
const DEFAULT_CONFIG = {
  max_connections: 20,
  idle_timeout: 30000,
  connection_timeout: 5000,
  ssl: process.env.NODE_ENV === 'production'
};

/**
 * Initializes the PostgreSQL database connection with connection pooling.
 * Implements requirement: Database Configuration - PostgreSQL integration
 * 
 * @returns An instance of the PostgreSQL connection pool
 * @throws Error if database configuration is invalid or connection fails
 */
export const initializeDatabase = (): Pool => {
  try {
    // Validate required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Encrypt sensitive connection details
    const encryptedPassword = encryptData(process.env.DB_PASSWORD!, process.env.ENCRYPTION_KEY!);

    // Configure database connection pool
    const poolConfig: PoolConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: parseInt(process.env.DB_MAX_CONNECTIONS!) || DEFAULT_CONFIG.max_connections,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT!) || DEFAULT_CONFIG.idle_timeout,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT!) || DEFAULT_CONFIG.connection_timeout,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false // Should be true in production with proper SSL certificates
      } : undefined
    };

    // Initialize connection pool
    const pool = new Pool(poolConfig);

    // Log successful initialization
    logInfo('Database connection pool initialized successfully');
    logInfo(`Database configuration: ${JSON.stringify({
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      max_connections: poolConfig.max,
      ssl_enabled: !!poolConfig.ssl
    })}`);

    // Handle pool errors
    pool.on('error', (err) => {
      logError(new Error(`Unexpected database pool error: ${err.message}`));
    });

    return pool;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown database initialization error');
    logError(err);
    throw err;
  }
};

/**
 * Tests the database connection to ensure it is operational.
 * Implements requirement: Database Configuration - Connection validation
 * 
 * @returns Promise<boolean> True if connection is successful, false otherwise
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  const pool = initializeDatabase();
  
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    logInfo('Database connection test successful');
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown database connection error');
    logError(err);
    return false;
  } finally {
    await pool.end();
  }
};