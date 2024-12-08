/**
 * Estate Kit - Backend Entry Point
 * Version: 1.0.0
 * 
 * This file serves as the main entry point for the Estate Kit backend system.
 * It initializes and configures the application, including middleware, routes, and services.
 * 
 * Requirements Addressed:
 * - API Gateway (Technical Specifications/2.2 Container Architecture/API Gateway)
 *   Implements the API gateway for routing and handling requests.
 * - Monitoring & Observability (Technical Specifications/2.7 Cross-Cutting Concerns/Monitoring & Observability)
 *   Integrates logging and monitoring tools for application observability.
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements authentication and authorization mechanisms.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Ensures data integrity through validation middleware.
 * 
 * Human Tasks:
 * 1. Configure environment variables in .env file
 * 2. Set up SSL certificates for HTTPS
 * 3. Configure CORS settings for allowed origins
 * 4. Review and adjust rate limiting settings
 * 5. Set up monitoring and logging infrastructure
 */

// @package express v4.18.2
import express, { Express } from 'express';
// @package dotenv v16.0.3
import dotenv from 'dotenv';

// Import configuration functions
import { initializeAuth0 } from './config/auth0';
import { initializeS3 } from './config/aws';
import { initializeDatabase } from './config/database';
import initializeRoutes from './api/routes/index';

// Import middleware
import { authMiddleware } from './api/middlewares/auth.middleware';
import { validateRequestMiddleware } from './api/middlewares/validation.middleware';
import { rbacMiddleware } from './api/middlewares/rbac.middleware';

// Import utilities
import { initializeLogger, logInfo, logError } from './utils/logger.util';

// Load environment variables
dotenv.config();

// Define port from environment variables or default
const PORT = process.env.PORT || 3000;

/**
 * Initializes the backend application by setting up middleware, routes, and services.
 * Implements requirements: API Gateway, Authentication, Data Validation
 */
export const initializeApp = async (): Promise<void> => {
  try {
    // Initialize logger
    const logger = initializeLogger();
    logInfo('Initializing Estate Kit backend application...');

    // Initialize Auth0 client
    await initializeAuth0();
    logInfo('Auth0 client initialized successfully');

    // Initialize AWS S3 client
    await initializeS3();
    logInfo('AWS S3 client initialized successfully');

    // Initialize database connection
    await initializeDatabase();
    logInfo('Database connection initialized successfully');

    // Create Express application instance
    const app: Express = express();

    // Apply global middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Configure CORS
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Apply security middleware
    app.use(authMiddleware);
    app.use(validateRequestMiddleware);
    app.use(rbacMiddleware());

    // Initialize and mount API routes
    const router = initializeRoutes(express.Router());
    app.use('/api', router);

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logError(err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
      });
    });

    // Start the server
    app.listen(PORT, () => {
      logInfo(`Estate Kit backend server running on port ${PORT}`);
      logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logError(error as Error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  initializeApp().catch(error => {
    logError(error as Error);
    process.exit(1);
  });
}

export default initializeApp;