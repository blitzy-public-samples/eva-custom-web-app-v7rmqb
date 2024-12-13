// External imports
// axios ^1.4.0 - HTTP client with extensive features
import type { AxiosRequestConfig } from 'axios';

// Interfaces for type safety and documentation
interface ApiConfig extends AxiosRequestConfig {
  securityConfig: SecurityConfig;
  monitoringConfig: MonitoringConfig;
  cacheConfig: CacheConfig;
  rateLimitConfig: RateLimitConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
  validationConfig: ValidationConfig;
}

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: any) => boolean;
  backoffStrategy: {
    type: 'exponential' | 'linear';
    factor: number;
  };
  timeoutStrategy: {
    baseTimeout: number;
    maxTimeout: number;
    incrementFactor: number;
  };
}

interface SecurityConfig {
  sslEnabled: boolean;
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
    credentials: boolean;
  };
  headers: {
    [key: string]: string;
  };
}

interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    responseTime: boolean;
    errorRate: boolean;
    requestCount: boolean;
  };
  logging: {
    level: string;
    request: boolean;
    response: boolean;
    errors: boolean;
  };
}

interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  invalidation: {
    automatic: boolean;
    interval: number;
  };
}

interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  errorMessage: string;
}

interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  resetTimeout: number;
  monitorInterval: number;
}

interface ValidationConfig {
  requestValidation: boolean;
  responseValidation: boolean;
  sanitization: boolean;
}

// Constants
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second
export const API_VERSION = '/v1';

export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

export const CORS_CONFIG = {
  enabled: true,
  allowedOrigins: [
    process.env.REACT_APP_FRONTEND_URL || 'https://estatekit.ca',
    'https://staging.estatekit.ca'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  credentials: true
};

// Environment-specific API URL getter with security validation
export const getApiUrl = (environment: string): string => {
  const envUrls: { [key: string]: string } = {
    production: 'https://api.estatekit.ca',
    staging: 'https://api.staging.estatekit.ca',
    development: 'https://api.dev.estatekit.ca',
    local: 'http://localhost:3000'
  };

  // Validate environment
  if (!Object.keys(envUrls).includes(environment)) {
    console.error(`Invalid environment: ${environment}`);
    return envUrls.production; // Secure fallback to production
  }

  // Ensure SSL for non-local environments
  if (environment !== 'local' && !envUrls[environment].startsWith('https')) {
    console.error('SSL required for non-local environments');
    return envUrls.production; // Secure fallback to production
  }

  return envUrls[environment];
};

// Main API configuration object
export const apiConfig: ApiConfig = {
  baseURL: getApiUrl(process.env.REACT_APP_ENV || 'production'),
  timeout: API_TIMEOUT,
  headers: {
    ...SECURITY_HEADERS,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status < 500,

  // Retry configuration with exponential backoff
  retryConfig: {
    retries: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    retryCondition: (error: any) => {
      return error.code !== 'ECONNABORTED' && (!error.response || (error.response.status >= 500 && error.response.status <= 599));
    },
    backoffStrategy: {
      type: 'exponential',
      factor: 2
    },
    timeoutStrategy: {
      baseTimeout: API_TIMEOUT,
      maxTimeout: API_TIMEOUT * 4,
      incrementFactor: 1.5
    }
  },

  // Security configuration
  securityConfig: {
    sslEnabled: true,
    cors: CORS_CONFIG,
    headers: SECURITY_HEADERS
  },

  // Monitoring configuration
  monitoringConfig: {
    enabled: true,
    metrics: {
      responseTime: true,
      errorRate: true,
      requestCount: true
    },
    logging: {
      level: 'info',
      request: true,
      response: true,
      errors: true
    }
  },

  // Cache configuration
  cacheConfig: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100, // Maximum number of cached responses
    invalidation: {
      automatic: true,
      interval: 600000 // 10 minutes
    }
  },

  // Rate limiting configuration
  rateLimitConfig: {
    enabled: true,
    maxRequests: 100, // Maximum requests per window
    windowMs: 60000, // 1 minute window
    errorMessage: 'Too many requests, please try again later.'
  },

  // Circuit breaker configuration
  circuitBreakerConfig: {
    enabled: true,
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    monitorInterval: 10000 // 10 seconds
  },

  // Validation configuration
  validationConfig: {
    requestValidation: true,
    responseValidation: true,
    sanitization: true
  }
};

export default apiConfig;