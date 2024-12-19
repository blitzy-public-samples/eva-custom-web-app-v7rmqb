// Intercom Configuration v4.0.0
// Implements secure, production-ready Intercom integration with comprehensive error handling and monitoring

import { Client } from 'intercom-client'; // v4.0.0
import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod'; // v3.22.0

// Configuration schema validation using Zod
const IntercomConfigSchema = z.object({
  appId: z.string().min(1),
  accessToken: z.string().min(1),
  signingSecret: z.string().min(32),
  apiVersion: z.string().default('2.9'),
  requestTimeout: z.number().min(1000).max(60000).default(30000),
  maxRetries: z.number().min(0).max(5).default(3),
  rateLimits: z.object({
    maxRequests: z.number().default(500),
    windowMs: z.number().default(60000)
  }).default({}),
  security: z.object({
    webhookToleranceSeconds: z.number().default(300),
    requireSignedRequests: z.boolean().default(true),
    verifyWebhookSignatures: z.boolean().default(true),
    minimumSigningSecretLength: z.number().default(32)
  }).default({})
});

// Custom error class for Intercom operations
export class IntercomError extends Error {
  constructor(
    public code: string,
    public message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'IntercomError';
  }
}

// Environment variable validation
export function validateEnvironmentVariables(): boolean {
  try {
    const config = {
      appId: process.env.INTERCOM_APP_ID || '',
      accessToken: process.env.INTERCOM_ACCESS_TOKEN || '',
      signingSecret: process.env.INTERCOM_SIGNING_SECRET || '',
      apiVersion: process.env.INTERCOM_API_VERSION || '2.9',
      requestTimeout: parseInt(process.env.INTERCOM_REQUEST_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.INTERCOM_MAX_RETRIES || '3')
    };

    IntercomConfigSchema.parse(config);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new IntercomError(
        'CONFIG_VALIDATION_ERROR',
        `Invalid Intercom configuration: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    return false;
  }
}

// Client configuration interface
interface IntercomClientOptions {
  requestTimeout?: number;
  maxRetries?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// Create production-ready Intercom client
export function createIntercomClient(options: IntercomClientOptions = {}): Client {
  if (!validateEnvironmentVariables()) {
    throw new IntercomError(
      'INVALID_CONFIG',
      'Invalid Intercom configuration. Please check environment variables.'
    );
  }

  const client = new Client({
    tokenAuth: {
      token: process.env.INTERCOM_ACCESS_TOKEN!
    },
    apiVersion: process.env.INTERCOM_API_VERSION || '2.9'
  });

  // Configure client with retry mechanism
  const retryConfig = {
    maxRetries: options.maxRetries || parseInt(process.env.INTERCOM_MAX_RETRIES || '3'),
    initialRetryDelayMs: 1000,
    maxRetryDelayMs: 10000
  };

  // Add request timeout
  const timeout = options.requestTimeout || 
    parseInt(process.env.INTERCOM_REQUEST_TIMEOUT || '30000');

  // Enhance client with error handling and monitoring
  const enhancedClient = new Proxy(client, {
    get(target: any, prop: string) {
      if (typeof target[prop] === 'function') {
        return async (...args: any[]) => {
          let lastError: Error | undefined;
          
          for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            try {
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), timeout);
              });

              const result = await Promise.race([
                target[prop].apply(target, args),
                timeoutPromise
              ]);

              return result;
            } catch (error: any) {
              lastError = error;
              
              if (attempt < retryConfig.maxRetries) {
                const delay = Math.min(
                  retryConfig.initialRetryDelayMs * Math.pow(2, attempt),
                  retryConfig.maxRetryDelayMs
                );
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          throw new IntercomError(
            'REQUEST_FAILED',
            `Intercom request failed after ${retryConfig.maxRetries} retries`,
            lastError
          );
        };
      }
      return target[prop];
    }
  });

  return enhancedClient;
}

// Webhook validation with enhanced security
export function validateIntercomWebhook(
  signature: string,
  rawBody: string,
  timestamp: number
): boolean {
  const config = getIntercomConfig();
  
  // Verify timestamp freshness
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - timestamp) > config.security.webhookToleranceSeconds) {
    throw new IntercomError(
      'INVALID_TIMESTAMP',
      'Webhook timestamp is outside acceptable range'
    );
  }

  // Validate signature format
  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    throw new IntercomError(
      'INVALID_SIGNATURE_FORMAT',
      'Invalid webhook signature format'
    );
  }

  try {
    // Compute expected signature
    const hmac = createHmac('sha256', config.signingSecret);
    hmac.update(timestamp + rawBody);
    const expectedSignature = hmac.digest('hex');

    // Perform timing-safe comparison
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    throw new IntercomError(
      'SIGNATURE_VERIFICATION_FAILED',
      'Failed to verify webhook signature',
      error instanceof Error ? error : undefined
    );
  }
}

// Get typed and validated configuration
export function getIntercomConfig() {
  const config = {
    appId: process.env.INTERCOM_APP_ID!,
    accessToken: process.env.INTERCOM_ACCESS_TOKEN!,
    signingSecret: process.env.INTERCOM_SIGNING_SECRET!,
    apiVersion: process.env.INTERCOM_API_VERSION || '2.9',
    requestTimeout: parseInt(process.env.INTERCOM_REQUEST_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.INTERCOM_MAX_RETRIES || '3'),
    rateLimits: {
      maxRequests: 500,
      windowMs: 60000
    },
    security: {
      webhookToleranceSeconds: 300,
      requireSignedRequests: true,
      verifyWebhookSignatures: true,
      minimumSigningSecretLength: 32
    }
  };

  return IntercomConfigSchema.parse(config);
}

// Rate limiting state
const rateLimitState = {
  requests: 0,
  windowStart: Date.now()
};

// Rate limiting helper
export function checkRateLimit(): boolean {
  const config = getIntercomConfig();
  const now = Date.now();
  
  if (now - rateLimitState.windowStart >= config.rateLimits.windowMs) {
    rateLimitState.requests = 0;
    rateLimitState.windowStart = now;
  }

  if (rateLimitState.requests >= config.rateLimits.maxRequests) {
    throw new IntercomError(
      'RATE_LIMIT_EXCEEDED',
      'Intercom rate limit exceeded'
    );
  }

  rateLimitState.requests++;
  return true;
}