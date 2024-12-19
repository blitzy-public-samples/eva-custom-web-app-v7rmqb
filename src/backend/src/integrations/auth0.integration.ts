import { ManagementClient, AuthenticationClient } from 'auth0'; // v3.0.0
import { JwtPayload } from 'jsonwebtoken'; // v9.0.0
import { JwksClient } from 'jwks-rsa'; // v3.0.1
import rateLimit from 'express-rate-limit'; // v6.0.0
import { AUTH0_CONFIG as auth0Config, JWT_CONFIG as jwtConfig } from '../config/auth0';

// Custom error types for better error handling
export class Auth0IntegrationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'Auth0IntegrationError';
  }
}

// Interface for Auth0Integration options
interface Auth0IntegrationOptions {
  maxRetries?: number;
  requestTimeout?: number;
  rateLimitOptions?: {
    windowMs: number;
    max: number;
  };
}

/**
 * Enhanced Auth0Integration class for handling authentication and user management
 * with improved security, monitoring, and error handling capabilities
 */
export class Auth0Integration {
  private readonly managementClient: ManagementClient;
  private readonly authClient: AuthenticationClient;
  private readonly maxRetries: number;
  private readonly requestTimeout: number;
  private readonly rateLimiter: any;

  /**
   * Initialize Auth0 integration with enhanced security configurations
   * @param options Configuration options for Auth0 integration
   */
  constructor(options: Auth0IntegrationOptions = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.requestTimeout = options.requestTimeout || 10000;

    // Initialize Auth0 Management Client with retry mechanism
    this.managementClient = new ManagementClient({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      clientSecret: auth0Config.clientSecret,
      retry: {
        enabled: true,
        maxRetries: this.maxRetries
      }
    });

    // Initialize Auth0 Authentication Client
    this.authClient = new AuthenticationClient({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      clientSecret: auth0Config.clientSecret
    });

    // Configure rate limiting
    this.rateLimiter = rateLimit({
      windowMs: options.rateLimitOptions?.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.rateLimitOptions?.max || 100 // limit each IP to 100 requests per windowMs
    });
  }

  /**
   * Verify JWT token with enhanced security checks and monitoring
   * @param token JWT token to verify
   * @returns Promise<JwtPayload> Decoded and verified JWT payload
   * @throws Auth0IntegrationError
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      // Initialize JWKS client with retry mechanism
      const jwksClient = new JwksClient({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`
      });

      // Get signing key
      const getKey = async (header: any, callback: any) => {
        try {
          const key = await jwksClient.getSigningKey(header.kid);
          const signingKey = key.getPublicKey();
          callback(null, signingKey);
        } catch (error) {
          callback(error, null);
        }
      };

      return new Promise((resolve, reject) => {
        const options = {
          algorithms: jwtConfig.algorithms,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience
        };

        require('jsonwebtoken').verify(token, getKey, options, (err: any, decoded: JwtPayload) => {
          if (err) {
            reject(new Auth0IntegrationError(
              `Token verification failed: ${err.message}`,
              'TOKEN_VERIFICATION_ERROR'
            ));
          } else {
            resolve(decoded);
          }
        });
      });
    } catch (error) {
      throw new Auth0IntegrationError(
        `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKEN_VERIFICATION_ERROR'
      );
    }
  }

  /**
   * Retrieve user information with enhanced error handling and retry mechanism
   * @param userId Auth0 user ID
   * @returns Promise<object> User profile information
   * @throws Auth0IntegrationError
   */
  async getUserInfo(userId: string): Promise<object> {
    let retries = 0;
    const maxRetries = this.maxRetries;

    const attemptGetUser = async (): Promise<object> => {
      try {
        const user = await this.managementClient.users.get({ id: userId });
        return {
          ...user,
          // Remove sensitive information
          password: undefined,
          passwordHash: undefined
        };
      } catch (error) {
        if (retries < maxRetries && error instanceof Error) {
          retries++;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          return attemptGetUser();
        }
        throw new Auth0IntegrationError(
          `Failed to retrieve user info: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'USER_INFO_ERROR'
        );
      }
    };

    return attemptGetUser();
  }

  /**
   * Handle token refresh with rate limiting and monitoring
   * @param refreshToken Refresh token
   * @returns Promise<object> New access token and refresh token
   * @throws Auth0IntegrationError
   */
  async refreshToken(refreshToken: string): Promise<object> {
    try {
      // Apply rate limiting
      await new Promise((resolve, reject) => {
        this.rateLimiter(
          { ip: '127.0.0.1' }, // Mock request object for rate limiting
          { send: () => reject(new Auth0IntegrationError('Rate limit exceeded', 'RATE_LIMIT_ERROR')) },
          resolve
        );
      });

      const response = await this.authClient.oauth.refreshTokenWithRefreshToken(refreshToken);

      // Verify new tokens
      if (typeof response === 'object' && 'access_token' in response) {
        await this.verifyToken(response.access_token as string);

        return {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresIn: response.expires_in
        };
      }

      throw new Auth0IntegrationError('Invalid token response', 'TOKEN_REFRESH_ERROR');
    } catch (error) {
      throw new Auth0IntegrationError(
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKEN_REFRESH_ERROR'
      );
    }
  }
}