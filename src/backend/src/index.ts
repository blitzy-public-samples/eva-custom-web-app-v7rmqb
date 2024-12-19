/**
 * Estate Kit Backend Entry Point
 * Initializes Express server with enhanced security features, PIPEDA/HIPAA compliance,
 * and comprehensive monitoring capabilities.
 * @version 1.0.0
 */

// External dependencies
import express, { Express } from 'express'; // ^4.18.2
import helmet from 'helmet'; // ^7.0.0
import compression from 'compression'; // ^1.7.4
import cors from 'cors'; // ^2.8.5
import rateLimit from 'express-rate-limit'; // ^7.0.0
import * as opentelemetry from '@opentelemetry/api'; // ^1.4.0

// Internal imports
import { dataSource } from './config/database';
import redisClient from './config/redis';
import router from './api/routes';
import errorMiddleware from './api/middlewares/error.middleware';
import { requestLogger } from './api/middlewares/logging.middleware';
import { logger } from './utils/logger.util';

// Initialize OpenTelemetry for distributed tracing
const tracer = opentelemetry.trace.getTracer('estate-kit-backend');

/**
 * Initializes and configures the Express server with enhanced security
 * and monitoring features
 */
async function initializeServer(): Promise<Express> {
  const app = express();

  // Enhanced security headers configuration
  const helmetOptions = {
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: true,
    xssFilter: true
  };

  // CORS configuration with security enhancements
  const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400
  };

  // Rate limiting configuration
  const rateLimitOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // Limit each IP
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: express.Request) => {
      const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
      return trustedIPs.length > 0 && trustedIPs.includes(req.ip || '');
    }
  };

  // Apply security middleware
  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(rateLimit(rateLimitOptions));

  // Request parsing middleware with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Add request logging and correlation tracking
  app.use(requestLogger);

  // Mount API routes
  app.use('/api/v1', router);

  // Error handling middleware
  app.use(errorMiddleware);

  return app;
}

/**
 * Starts the server with database and Redis connections
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database connection with retry logic
    await dataSource.initialize();
    logger.info('Database connection established successfully');

    // Initialize Redis connection
    const redisInstance = await redisClient;
    logger.info('Redis connection established successfully');

    // Initialize Express server
    const app = await initializeServer();
    const port = process.env.PORT || 3000;

    // Start server
    const server = app.listen(port, () => {
      logger.info(`Server started successfully on port ${port}`, {
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      });
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => handleShutdown(server));
    process.on('SIGINT', () => handleShutdown(server));

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

/**
 * Handles graceful server shutdown
 */
async function handleShutdown(server: any): Promise<void> {
  logger.info('Initiating graceful shutdown');

  try {
    // Close server
    server.close();

    // Close database connection
    await dataSource.destroy();
    logger.info('Database connection closed');

    // Close Redis connection
    const redisInstance = await redisClient;
    await redisInstance.disconnect();
    logger.info('Redis connection closed');

    // Log successful shutdown
    logger.info('Server shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Fatal error during server startup', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});

// Export for testing purposes
export { initializeServer, startServer, handleShutdown };