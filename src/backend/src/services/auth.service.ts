import { Redis } from 'ioredis'; // v5.0.0
import { JwtPayload } from 'jsonwebtoken'; // v9.0.0
import DeviceDetector from 'device-detector-js'; // v3.0.0
import { Auth0Integration } from '../integrations/auth0.integration';
import { User } from '../types/user.types';
import { createHash } from 'crypto';

// Constants for authentication and session management
const SESSION_EXPIRY = 3600; // 1 hour in seconds
const TOKEN_REFRESH_WINDOW = 300; // 5 minutes before expiry
const MAX_CONCURRENT_SESSIONS = 3;
const FAILED_ATTEMPTS_THRESHOLD = 5;
const SESSION_CLEANUP_INTERVAL = 900; // 15 minutes

// Custom types for authentication flows
interface AuthResult {
  sessionId: string;
  user: User;
  expiresIn: number;
  deviceId: string;
}

interface SessionValidationResult {
  isValid: boolean;
  user?: User;
  securityContext?: {
    deviceMatch: boolean;
    ipMatch: boolean;
    concurrent: number;
  };
}

interface SessionData {
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  createdAt: number;
  lastAccessedAt: number;
}

/**
 * Enhanced authentication service with secure session management and monitoring
 */
export class AuthService {
  private readonly sessionPrefix = 'session:';
  private readonly userSessionsPrefix = 'user-sessions:';

  constructor(
    private readonly auth0Integration: Auth0Integration,
    private readonly redisClient: Redis,
    private readonly deviceDetector: DeviceDetector
  ) {
    // Initialize session cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), SESSION_CLEANUP_INTERVAL * 1000);
  }

  /**
   * Generate secure device fingerprint from user agent
   * @param userAgent Browser user agent string
   * @returns Hashed device fingerprint
   */
  private generateDeviceFingerprint(userAgent: string): string {
    const device = this.deviceDetector.parse(userAgent);
    const fingerprintData = JSON.stringify({
      client: device.client,
      os: device.os,
      device: device.device
    });
    return createHash('sha256').update(fingerprintData).digest('hex');
  }

  /**
   * Authenticate user with enhanced security measures
   * @param token JWT token from Auth0
   * @param ipAddress Client IP address
   * @param userAgent Browser user agent
   * @returns Authentication result with session details
   */
  async authenticateUser(
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResult> {
    try {
      // Verify JWT token
      const decodedToken = await this.auth0Integration.verifyToken(token);
      const userId = decodedToken.sub!;

      // Generate device fingerprint
      const deviceFingerprint = this.generateDeviceFingerprint(userAgent);

      // Get user information
      const userInfo = await this.auth0Integration.getUserInfo(userId);
      
      // Check concurrent sessions
      const activeSessions = await this.redisClient.scard(
        `${this.userSessionsPrefix}${userId}`
      );
      
      if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
        // Remove oldest session if limit reached
        const oldestSession = await this.redisClient.spop(
          `${this.userSessionsPrefix}${userId}`
        );
        if (oldestSession) {
          await this.revokeSession(oldestSession, true);
        }
      }

      // Create new session
      const sessionId = createHash('sha256')
        .update(`${userId}${Date.now()}${Math.random()}`)
        .digest('hex');

      const sessionData: SessionData = {
        userId,
        deviceFingerprint,
        ipAddress,
        createdAt: Date.now(),
        lastAccessedAt: Date.now()
      };

      // Store session data with expiry
      await this.redisClient
        .multi()
        .setex(
          `${this.sessionPrefix}${sessionId}`,
          SESSION_EXPIRY,
          JSON.stringify(sessionData)
        )
        .sadd(`${this.userSessionsPrefix}${userId}`, sessionId)
        .exec();

      return {
        sessionId,
        user: userInfo as User,
        expiresIn: SESSION_EXPIRY,
        deviceId: deviceFingerprint
      };
    } catch (error) {
      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate session with comprehensive security checks
   * @param sessionId Active session identifier
   * @param ipAddress Current client IP address
   * @param deviceFingerprint Current device fingerprint
   * @returns Session validation result with security context
   */
  async validateSession(
    sessionId: string,
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<SessionValidationResult> {
    try {
      const sessionData = await this.redisClient.get(
        `${this.sessionPrefix}${sessionId}`
      );

      if (!sessionData) {
        return { isValid: false };
      }

      const session: SessionData = JSON.parse(sessionData);

      // Perform security checks
      const deviceMatch = session.deviceFingerprint === deviceFingerprint;
      const ipMatch = session.ipAddress === ipAddress;
      const concurrent = await this.redisClient.scard(
        `${this.userSessionsPrefix}${session.userId}`
      );

      // Update last accessed timestamp
      if (deviceMatch && ipMatch) {
        session.lastAccessedAt = Date.now();
        await this.redisClient.setex(
          `${this.sessionPrefix}${sessionId}`,
          SESSION_EXPIRY,
          JSON.stringify(session)
        );
      }

      const userInfo = await this.auth0Integration.getUserInfo(session.userId);

      return {
        isValid: deviceMatch && ipMatch,
        user: userInfo as User,
        securityContext: {
          deviceMatch,
          ipMatch,
          concurrent
        }
      };
    } catch (error) {
      throw new Error(
        `Session validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Revoke user session with cleanup
   * @param sessionId Session to revoke
   * @param isForced Whether revocation is forced
   */
  async revokeSession(sessionId: string, isForced: boolean = false): Promise<void> {
    try {
      const sessionData = await this.redisClient.get(
        `${this.sessionPrefix}${sessionId}`
      );

      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);

        await this.redisClient
          .multi()
          .del(`${this.sessionPrefix}${sessionId}`)
          .srem(`${this.userSessionsPrefix}${session.userId}`, sessionId)
          .exec();
      }
    } catch (error) {
      throw new Error(
        `Session revocation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Cleanup expired sessions periodically
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const sessionKeys = await this.redisClient.keys(`${this.sessionPrefix}*`);
      
      for (const key of sessionKeys) {
        const sessionData = await this.redisClient.get(key);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);
          const age = Date.now() - session.lastAccessedAt;
          
          if (age > SESSION_EXPIRY * 1000) {
            const sessionId = key.replace(this.sessionPrefix, '');
            await this.revokeSession(sessionId, true);
          }
        }
      }
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }
}