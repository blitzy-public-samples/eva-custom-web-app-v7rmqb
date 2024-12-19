/**
 * Subscription Routes Configuration
 * Implements secure subscription management endpoints with Shopify integration
 * @version 1.0.0
 */

import { Router, Request, Response, NextFunction } from 'express'; // ^4.18.2
import rateLimit from 'express-rate-limit'; // ^6.7.0
import cors from 'cors'; // ^2.8.5

// Internal imports
import { 
  createSubscription,
  updateSubscription,
  getSubscription,
  getSubscription as getUserSubscription, // Using getSubscription for user subscription
  cancelSubscription,
  handleShopifyWebhook
} from '../controllers/subscriptions.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/rbac.middleware';
import errorHandler from '../middlewares/error.middleware';
import { 
  createSubscriptionSchema,
  updateSubscriptionSchema,
  subscriptionIdSchema 
} from '../validators/subscriptions.validator';
import { ResourceType, AccessLevel } from '../../types/permission.types';

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
  checkPermission(ResourceType.FINANCIAL_DATA, AccessLevel.WRITE),
  validateRequest(createSubscriptionSchema, {
    resourceType: 'SUBSCRIPTION',
    sensitiveFields: ['shopifyCustomerId'],
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  (req: Request, res: Response, next: NextFunction) => {
    const subscriptionData = req.validatedData;
    return createSubscription(subscriptionData);
  }
);

// Update subscription endpoint
router.put('/:subscriptionId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  checkPermission(ResourceType.FINANCIAL_DATA, AccessLevel.WRITE),
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
  (req: Request, res: Response, next: NextFunction) => {
    const { subscriptionId } = req.params;
    const updateData = req.validatedData;
    return updateSubscription(subscriptionId, updateData);
  }
);

// Get subscription endpoint
router.get('/:subscriptionId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  checkPermission(ResourceType.FINANCIAL_DATA, AccessLevel.READ),
  validateRequest(subscriptionIdSchema, {
    resourceType: 'SUBSCRIPTION',
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  (req: Request, res: Response, next: NextFunction) => {
    const { subscriptionId } = req.params;
    return getSubscription(subscriptionId);
  }
);

// Get user subscription endpoint
router.get('/user/:userId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  checkPermission(ResourceType.FINANCIAL_DATA, AccessLevel.READ),
  validateRequest(subscriptionIdSchema, {
    resourceType: 'SUBSCRIPTION',
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    return getUserSubscription(userId);
  }
);

// Cancel subscription endpoint
router.delete('/:subscriptionId',
  rateLimit(RATE_LIMIT_CONFIG.standard),
  authMiddleware,
  checkPermission(ResourceType.FINANCIAL_DATA, AccessLevel.WRITE),
  validateRequest(subscriptionIdSchema, {
    resourceType: 'SUBSCRIPTION',
    complianceRequirements: ['PIPEDA']
  }),
  errorHandler,
  (req: Request, res: Response, next: NextFunction) => {
    const { subscriptionId } = req.params;
    return cancelSubscription(subscriptionId);
  }
);

// Shopify webhook endpoint
router.post('/webhook/shopify',
  rateLimit(RATE_LIMIT_CONFIG.webhook),
  validateShopifyWebhook,
  errorHandler,
  (req: Request, res: Response, next: NextFunction) => {
    const webhookData = req.body;
    const signature = req.headers['x-shopify-hmac-sha256'];
    return handleShopifyWebhook(webhookData, signature as string);
  }
);

/**
 * Validates Shopify webhook signatures
 */
function validateShopifyWebhook(req: Request, res: Response, next: NextFunction) {
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