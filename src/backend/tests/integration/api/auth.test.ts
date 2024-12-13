// @ts-check
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'; // v29.5.0
import supertest from 'supertest'; // v6.3.3
import { AuthController } from '../../../src/api/controllers/auth.controller';
import { AuthService } from '../../../src/services/auth.service';
import { createMockUser } from '../../mocks/user.mock';
import { UserStatus } from '../../../src/types/user.types';
import express from 'express'; // v4.18.2

// Test constants
const TEST_USER = {
  email: 'test@estatekit.ca',
  password: 'TestPassword123!',
  name: 'Test User',
  province: 'ON',
  mfaEnabled: true,
  deviceFingerprint: 'mock-device-fingerprint',
  ipAddress: '127.0.0.1'
};

const TEST_AUTH_TOKEN = 'mock-jwt-token';
const TEST_REFRESH_TOKEN = 'mock-refresh-token';
const TEST_MFA_TOKEN = 'mock-mfa-token';
const TEST_DEVICE_FINGERPRINT = 'mock-device-fingerprint';

// Mock AuthService
const mockAuthService = {
  authenticateUser: jest.fn(),
  validateSession: jest.fn(),
  revokeSession: jest.fn(),
  validateDeviceFingerprint: jest.fn(),
  validateMFAToken: jest.fn(),
  checkRateLimit: jest.fn()
} as jest.Mocked<AuthService>;

// Setup test app
const app = express();
app.use(express.json());
const authController = new AuthController(mockAuthService);

// Configure routes
app.post('/auth/login', authController.login.bind(authController));
app.post('/auth/logout', authController.logout.bind(authController));
app.post('/auth/refresh', authController.refreshToken.bind(authController));
app.post('/auth/register', authController.register.bind(authController));

// Test request wrapper
const request = supertest(app);

describe('AuthController Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('/auth/login', () => {
    test('should successfully login with valid credentials and device fingerprint', async () => {
      // Mock successful authentication
      const mockUser = createMockUser({
        email: TEST_USER.email,
        name: TEST_USER.name,
        profile: { province: TEST_USER.province, mfaEnabled: TEST_USER.mfaEnabled }
      });

      mockAuthService.authenticateUser.mockResolvedValueOnce({
        sessionId: 'test-session-id',
        user: mockUser,
        expiresIn: 3600,
        deviceId: TEST_DEVICE_FINGERPRINT
      });

      const response = await request
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .set('X-Device-ID', TEST_DEVICE_FINGERPRINT)
        .set('User-Agent', 'test-user-agent')
        .expect(200);

      expect(response.body).toMatchObject({
        sessionId: expect.any(String),
        user: {
          email: TEST_USER.email,
          status: UserStatus.ACTIVE
        },
        security: {
          deviceId: TEST_DEVICE_FINGERPRINT,
          expiresIn: expect.any(Number)
        }
      });

      // Verify security headers
      expect(response.headers).toMatchObject({
        'strict-transport-security': expect.any(String),
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY'
      });
    });

    test('should fail login with invalid device fingerprint', async () => {
      mockAuthService.validateDeviceFingerprint.mockResolvedValueOnce(false);

      await request
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .set('X-Device-ID', 'invalid-fingerprint')
        .expect(401);
    });

    test('should require MFA token when enabled', async () => {
      mockAuthService.validateMFAToken.mockResolvedValueOnce(false);

      await request
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .set('X-Device-ID', TEST_DEVICE_FINGERPRINT)
        .set('X-MFA-Token', 'invalid-token')
        .expect(401);
    });

    test('should enforce rate limiting', async () => {
      mockAuthService.checkRateLimit.mockResolvedValueOnce(false);

      await request
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .expect(429);
    });
  });

  describe('/auth/refresh', () => {
    test('should successfully refresh token with valid session', async () => {
      const mockUser = createMockUser();
      mockAuthService.validateSession.mockResolvedValueOnce({
        isValid: true,
        user: mockUser,
        securityContext: {
          deviceMatch: true,
          ipMatch: true,
          concurrent: 1
        }
      });

      mockAuthService.authenticateUser.mockResolvedValueOnce({
        sessionId: 'new-session-id',
        user: mockUser,
        expiresIn: 3600,
        deviceId: TEST_DEVICE_FINGERPRINT
      });

      const response = await request
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .set('X-Session-ID', 'current-session-id')
        .set('X-Device-ID', TEST_DEVICE_FINGERPRINT)
        .expect(200);

      expect(response.body).toMatchObject({
        sessionId: expect.any(String),
        expiresIn: expect.any(Number),
        security: {
          deviceId: TEST_DEVICE_FINGERPRINT,
          timestamp: expect.any(Number)
        }
      });
    });

    test('should fail refresh with invalid session', async () => {
      mockAuthService.validateSession.mockResolvedValueOnce({
        isValid: false
      });

      await request
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .set('X-Session-ID', 'invalid-session')
        .set('X-Device-ID', TEST_DEVICE_FINGERPRINT)
        .expect(401);
    });
  });

  describe('/auth/logout', () => {
    test('should successfully logout with valid session', async () => {
      mockAuthService.revokeSession.mockResolvedValueOnce();

      await request
        .post('/auth/logout')
        .set('X-Session-ID', 'valid-session-id')
        .expect(200);

      expect(mockAuthService.revokeSession).toHaveBeenCalledWith('valid-session-id');
    });

    test('should fail logout with invalid session', async () => {
      mockAuthService.revokeSession.mockRejectedValueOnce(
        new Error('Invalid session')
      );

      await request
        .post('/auth/logout')
        .set('X-Session-ID', 'invalid-session')
        .expect(401);
    });
  });

  describe('Security Headers', () => {
    test('should include all required security headers', async () => {
      const mockUser = createMockUser();
      mockAuthService.authenticateUser.mockResolvedValueOnce({
        sessionId: 'test-session-id',
        user: mockUser,
        expiresIn: 3600,
        deviceId: TEST_DEVICE_FINGERPRINT
      });

      const response = await request
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .set('X-Device-ID', TEST_DEVICE_FINGERPRINT);

      expect(response.headers).toMatchObject({
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
        'content-security-policy': "default-src 'self'",
        'cache-control': 'no-store, max-age=0'
      });
    });
  });
});