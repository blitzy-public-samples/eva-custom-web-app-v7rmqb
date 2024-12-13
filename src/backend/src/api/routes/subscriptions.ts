/**
 * Subscription Routes Configuration
 * Implements secure subscription management endpoints with Shopify integration
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import rateLimit from 'express-rate-limit'; // ^6.7.0
import cors from 'cors'; // ^2.8.5

// Internal imports
import { 
  createSubscription,
  updateSubscription,
  getSubscription,
  getUserSubscription,
  cancelSubscription,
  handleShopifyWebhook
} from '../controllers/subscriptions.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';
import errorHandler from '../middlewares/error.middleware';
import { 
  createSubscriptionSchema,
  updateSubscriptionSchema,
  subscriptionIdSchema 
} from '../validators/subscriptions.validator';

// Initialize router
const router = Router();

// Security configuration
const CORS_OPTIONS = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  maxAge: 600 // 10 minutes
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  },
  webhook: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50 // 50 requests per window
  }
};

// Apply base middleware
router.use(cors(CORS_OPTIONS));

// Create subscription endpoint
router.post('/',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  rbacMiddleware(['ADMIN', 'USER']),
  validateRequest(createSubscriptionSchema, {
    resourceType: 'SUBSCRIPTION',
    sensitiveFields: ['shopifyCustomerId'],
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  createSubscription
);

// Update subscription endpoint
router.put('/:subscriptionId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  rbacMiddleware(['ADMIN', 'USER']),
  validateRequest(subscriptionIdSchema, {
    resourceType: 'SUBSCRIPTION',
    complianceRequirements: ['PIPEDA']
  }),
  validateRequest(updateSubscriptionSchema, {
    resourceType: 'SUBSCRIPTION',
    sensitiveFields: ['shopifyCustomerId'],
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  updateSubscription
);

// Get subscription endpoint
router.get('/:subscriptionId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  rbacMiddleware(['ADMIN', 'USER']),
  validateRequest(subscriptionIdSchema, {
    resourceType: 'SUBSCRIPTION',
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  getSubscription
);

// Get user subscription endpoint
router.get('/user/:userId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  rbacMiddleware(['ADMIN', 'USER']),
  validateRequest(subscriptionIdSchema, {
    resourceType: 'SUBSCRIPTION',
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  getUserSubscription
);

// Cancel subscription endpoint
router.delete('/:subscriptionId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  rbacMiddleware(['ADMIN', 'USER']),
  validateRequest(subscriptionIdSchema, {
    resourceType: 'SUBSCRIPTION',
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  cancelSubscription
);

// Shopify webhook endpoint
router.post('/webhook/shopify',
  rateLimit(RATE_LIMIT_CONFIG.webhook),
  validateShopifyWebhook,
  errorHandler,
  handleShopifyWebhook
);

/**
 * Validates Shopify webhook signatures
 */
function validateShopifyWebhook(req: any, res: any, next: any) {
  const signature = req.headers['x-shopify-hmac-sha256'];
  const topic = req.headers['x-shopify-topic'];
  
  if (!signature || !topic) {
    return res.status(401).json({
      error: 'Invalid webhook signature or topic'
    });
  }

  // Add correlation ID for request tracking
  req.headers['x-correlation-id'] = `shopify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  next();
}

export default router;