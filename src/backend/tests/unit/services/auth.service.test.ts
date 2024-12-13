import { describe, expect, jest, beforeEach, afterEach, it } from '@jest/globals'; // v29.0.0
import Redis from 'ioredis-mock'; // v8.0.0
import { Auth0Integration } from '../../src/integrations/auth0.integration';
import { AuthService } from '../../src/services/auth.service';
import { createMockUser } from '../../mocks/user.mock';
import { UserStatus } from '../../src/types/user.types';

// Mock Auth0Integration
jest.mock('../../src/integrations/auth0.integration');
const mockAuth0Integration = jest.mocked(Auth0Integration);

// Mock device detector
const mockDeviceDetector = {
  parse: jest.fn()
};

describe('AuthService', () => {
  let authService: AuthService;
  let redisClient: Redis;
  const mockUser = createMockUser();
  const mockDeviceFingerprint = 'mock-device-fingerprint';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const mockToken = 'valid.jwt.token';
  const mockSessionId = 'mock-session-id';

  beforeEach(() => {
    // Reset mocks and create fresh instances
    jest.clearAllMocks();
    redisClient = new Redis();
    mockDeviceDetector.parse.mockReturnValue({
      client: { type: 'browser', name: 'Chrome', version: '91.0' },
      os: { name: 'Windows', version: '10' },
      device: { type: 'desktop' }
    });

    // Initialize AuthService with mocked dependencies
    authService = new AuthService(
      new mockAuth0Integration(),
      redisClient,
      mockDeviceDetector
    );

    // Setup basic mock implementations
    mockAuth0Integration.prototype.verifyToken.mockResolvedValue({
      sub: mockUser.id,
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    mockAuth0Integration.prototype.getUserInfo.mockResolvedValue(mockUser);
  });

  afterEach(async () => {
    await redisClient.flushall();
  });

  describe('authenticateUser', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const result = await authService.authenticateUser(
        mockToken,
        mockIpAddress,
        mockUserAgent
      );

      expect(result).toMatchObject({
        user: mockUser,
        expiresIn: expect.any(Number),
        deviceId: expect.any(String),
        sessionId: expect.any(String)
      });

      expect(mockAuth0Integration.prototype.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockAuth0Integration.prototype.getUserInfo).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle concurrent session limits', async () => {
      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 4; i++) {
        const result = await authService.authenticateUser(
          mockToken,
          mockIpAddress,
          mockUserAgent
        );
        sessions.push(result.sessionId);
      }

      // Verify oldest session was removed
      const activeSessions = await redisClient.scard(`user-sessions:${mockUser.id}`);
      expect(activeSessions).toBe(3);
      
      // Verify first session was removed
      const firstSessionExists = await redisClient.exists(`session:${sessions[0]}`);
      expect(firstSessionExists).toBe(0);
    });

    it('should reject authentication with invalid token', async () => {
      mockAuth0Integration.prototype.verifyToken.mockRejectedValue(
        new Error('Invalid token')
      );

      await expect(
        authService.authenticateUser(mockToken, mockIpAddress, mockUserAgent)
      ).rejects.toThrow('Authentication failed');
    });

    it('should create session with device fingerprint binding', async () => {
      const result = await authService.authenticateUser(
        mockToken,
        mockIpAddress,
        mockUserAgent
      );

      const sessionData = await redisClient.get(`session:${result.sessionId}`);
      expect(sessionData).toBeTruthy();
      expect(JSON.parse(sessionData!)).toMatchObject({
        deviceFingerprint: expect.any(String),
        ipAddress: mockIpAddress
      });
    });
  });

  describe('validateSession', () => {
    let activeSessionId: string;

    beforeEach(async () => {
      const authResult = await authService.authenticateUser(
        mockToken,
        mockIpAddress,
        mockUserAgent
      );
      activeSessionId = authResult.sessionId;
    });

    it('should validate active session with matching device fingerprint', async () => {
      const result = await authService.validateSession(
        activeSessionId,
        mockIpAddress,
        mockDeviceFingerprint
      );

      expect(result).toMatchObject({
        isValid: true,
        user: mockUser,
        securityContext: {
          deviceMatch: true,
          ipMatch: true,
          concurrent: 1
        }
      });
    });

    it('should reject session with mismatched device fingerprint', async () => {
      const result = await authService.validateSession(
        activeSessionId,
        mockIpAddress,
        'different-device-fingerprint'
      );

      expect(result).toMatchObject({
        isValid: false,
        securityContext: {
          deviceMatch: false,
          ipMatch: true,
          concurrent: 1
        }
      });
    });

    it('should reject session with mismatched IP address', async () => {
      const result = await authService.validateSession(
        activeSessionId,
        '10.0.0.1',
        mockDeviceFingerprint
      );

      expect(result).toMatchObject({
        isValid: false,
        securityContext: {
          deviceMatch: true,
          ipMatch: false,
          concurrent: 1
        }
      });
    });

    it('should handle non-existent session', async () => {
      const result = await authService.validateSession(
        'non-existent-session',
        mockIpAddress,
        mockDeviceFingerprint
      );

      expect(result).toMatchObject({
        isValid: false
      });
    });
  });

  describe('revokeSession', () => {
    let activeSessionId: string;

    beforeEach(async () => {
      const authResult = await authService.authenticateUser(
        mockToken,
        mockIpAddress,
        mockUserAgent
      );
      activeSessionId = authResult.sessionId;
    });

    it('should successfully revoke active session', async () => {
      await authService.revokeSession(activeSessionId);

      const sessionExists = await redisClient.exists(`session:${activeSessionId}`);
      expect(sessionExists).toBe(0);

      const userSessions = await redisClient.smembers(`user-sessions:${mockUser.id}`);
      expect(userSessions).not.toContain(activeSessionId);
    });

    it('should handle forced session revocation', async () => {
      await authService.revokeSession(activeSessionId, true);

      const sessionExists = await redisClient.exists(`session:${activeSessionId}`);
      expect(sessionExists).toBe(0);
    });

    it('should handle non-existent session revocation gracefully', async () => {
      await expect(
        authService.revokeSession('non-existent-session')
      ).resolves.not.toThrow();
    });
  });

  describe('security validation', () => {
    it('should handle session cleanup for expired sessions', async () => {
      // Create an expired session
      const expiredSessionData = {
        userId: mockUser.id,
        deviceFingerprint: mockDeviceFingerprint,
        ipAddress: mockIpAddress,
        createdAt: Date.now() - 7200000, // 2 hours ago
        lastAccessedAt: Date.now() - 7200000
      };

      await redisClient.setex(
        `session:expired-session`,
        3600,
        JSON.stringify(expiredSessionData)
      );

      // Trigger cleanup
      await (authService as any).cleanupExpiredSessions();

      const sessionExists = await redisClient.exists('session:expired-session');
      expect(sessionExists).toBe(0);
    });

    it('should maintain session count within limits', async () => {
      const sessions = [];
      
      // Create maximum allowed sessions
      for (let i = 0; i < 3; i++) {
        const result = await authService.authenticateUser(
          mockToken,
          mockIpAddress,
          mockUserAgent
        );
        sessions.push(result.sessionId);
      }

      // Verify session count
      const sessionCount = await redisClient.scard(`user-sessions:${mockUser.id}`);
      expect(sessionCount).toBe(3);

      // Attempt to create another session
      const newSession = await authService.authenticateUser(
        mockToken,
        mockIpAddress,
        mockUserAgent
      );

      // Verify oldest session was removed
      const oldestSessionExists = await redisClient.exists(`session:${sessions[0]}`);
      expect(oldestSessionExists).toBe(0);

      // Verify total session count remains at maximum
      const finalSessionCount = await redisClient.scard(`user-sessions:${mockUser.id}`);
      expect(finalSessionCount).toBe(3);
    });
  });
});