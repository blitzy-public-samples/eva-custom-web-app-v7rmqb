/**
 * Authentication Middleware for Estate Kit Platform
 * Implements JWT validation with Auth0 integration and enhanced security logging
 * Compliant with PIPEDA and HIPAA requirements
 * @module auth.middleware
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import * as jwt from 'jsonwebtoken'; // jsonwebtoken v9.0.0
import { JwksClient } from 'jwks-rsa'; // jwks-rsa v3.0.1
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import { jwtConfig } from '../../config/auth0';
import { AuthenticationError } from '../../utils/error.util';
import { logger } from '../../utils/logger.util';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

// Configure JWKS client for Auth0 public key retrieval
const jwksClient = new JwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

/**
 * Interface for enhanced request object with user context
 */
interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload;
  securityContext?: {
    correlationId: string;
    authTime: number;
    accessLevel: string;
  };
}

/**
 * Extracts JWT token from Authorization header with security validation
 * @param req Express request object
 * @returns Extracted JWT token or null
 */
const getTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Validate header format
  if (!authHeader.startsWith('Bearer ')) {
    logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
      severity: AuditSeverity.WARNING,
      message: 'Invalid authorization header format',
      ipAddress: req.ip
    });
    return null;
  }

  const token = authHeader.split(' ')[1];

  // Basic token format validation
  if (!token || token.length < 10) {
    logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
      severity: AuditSeverity.WARNING,
      message: 'Invalid token format',
      ipAddress: req.ip
    });
    return null;
  }

  return token;
};

/**
 * Validates JWT token using Auth0 public key and configuration
 * @param token JWT token to validate
 * @param correlationId Request correlation ID for tracking
 * @returns Decoded JWT payload if valid
 * @throws AuthenticationError if validation fails
 */
const validateToken = async (token: string, correlationId: string): Promise<jwt.JwtPayload> => {
  try {
    // Get signing key from JWKS endpoint
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || !decodedToken.header.kid) {
      throw new Error('Invalid token structure');
    }

    const signingKey = await jwksClient.getSigningKey(decodedToken.header.kid);
    const publicKey = signingKey.getPublicKey();

    // Verify token with comprehensive checks
    const verified = jwt.verify(token, publicKey, {
      algorithms: [...jwtConfig.algorithms],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      clockTolerance: 60, // 1 minute clock skew tolerance
      complete: true
    }) as jwt.JwtPayload;

    // Log successful validation
    logger.info('Token validation successful', {
      correlationId,
      userId: verified.sub,
      audience: verified.aud
    });

    return verified;
  } catch (error) {
    logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
      severity: AuditSeverity.ERROR,
      message: 'Token validation failed',
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw new AuthenticationError('Invalid or expired token');
  }
};

/**
 * Express middleware that enforces JWT authentication with compliance logging
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const correlationId = uuidv4();
  logger.addCorrelationId(correlationId);

  try {
    // Extract and validate token
    const token = getTokenFromHeader(req);
    if (!token) {
      logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
        severity: AuditSeverity.WARNING,
        message: 'Missing authentication token',
        correlationId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      throw new AuthenticationError('Authentication token required');
    }

    // Validate token and decode payload
    const decodedToken = await validateToken(token, correlationId);

    // Attach user and security context to request
    req.user = decodedToken;
    req.securityContext = {
      correlationId,
      authTime: Date.now(),
      accessLevel: decodedToken.scope || 'default'
    };

    // Log successful authentication
    logger.logSecurityEvent(AuditEventType.USER_LOGIN, {
      severity: AuditSeverity.INFO,
      message: 'Authentication successful',
      correlationId,
      userId: decodedToken.sub,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    next();
  } catch (error) {
    // Enhanced error handling with security logging
    const authError = error instanceof AuthenticationError
      ? error
      : new AuthenticationError('Authentication failed');

    logger.error('Authentication middleware error', {
      correlationId,
      error: authError,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(401).json({
      success: false,
      error: {
        message: authError.message,
        code: 'AUTHENTICATION_ERROR',
        correlationId
      }
    });
  }
};