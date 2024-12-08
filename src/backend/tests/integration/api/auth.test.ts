/**
 * Estate Kit - Authentication API Integration Tests
 * Version: 1.0.0
 * 
 * Human Tasks:
 * 1. Configure test environment variables for Auth0 credentials
 * 2. Set up test database with sample user data
 * 3. Configure test JWT tokens with appropriate claims
 * 4. Review and update test cases when authentication requirements change
 */

// @package supertest ^6.3.3
// @package jest ^29.0.0
import request from 'supertest';
import { Express } from 'express';
import { login, validateToken } from '../../src/api/controllers/auth.controller';
import { validateAuthRequest, validateTokenRequest } from '../../src/api/validators/auth.validator';
import { validateToken as validateAuth0Token } from '../../src/config/auth0';
import { authenticateUser } from '../../src/services/auth.service';
import { handleError } from '../../src/utils/error.util';

// Mock Express app for testing
let app: Express;

// Sample test data
const validCredentials = {
  username: 'test@example.com',
  password: 'Test@123!'
};

const invalidCredentials = {
  username: 'invalid@example.com',
  password: 'invalid'
};

const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const invalidToken = 'invalid.token.string';

describe('Authentication API Integration Tests', () => {
  beforeAll(() => {
    // Initialize Express app and configure routes
    app = require('../../src/app').default;
  });

  /**
   * Test: Valid Login Test
   * Requirement: Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
   * Description: Ensures that the login endpoint works correctly for valid credentials.
   */
  describe('POST /api/auth/login', () => {
    it('should return 200 and valid token for correct credentials', async () => {
      // Arrange
      const endpoint = '/api/auth/login';

      // Act
      const response = await request(app)
        .post(endpoint)
        .send(validCredentials)
        .expect('Content-Type', /json/);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('profile');
      expect(response.body.data.profile).toHaveProperty('userId');
      expect(response.body.data.profile).toHaveProperty('email');
      expect(response.body.data.profile).toHaveProperty('role');
    });

    /**
     * Test: Invalid Login Test
     * Requirement: Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
     * Description: Ensures that the login endpoint returns an error for invalid credentials.
     */
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const endpoint = '/api/auth/login';

      // Act
      const response = await request(app)
        .post(endpoint)
        .send(invalidCredentials)
        .expect('Content-Type', /json/);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should return 400 for malformed request', async () => {
      // Arrange
      const endpoint = '/api/auth/login';
      const malformedData = { username: 'test' }; // Missing password

      // Act
      const response = await request(app)
        .post(endpoint)
        .send(malformedData)
        .expect('Content-Type', /json/);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid request format');
    });
  });

  /**
   * Test: Valid Token Validation Test
   * Requirement: Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
   * Description: Ensures that the token validation endpoint works correctly for valid JWT tokens.
   */
  describe('POST /api/auth/validate', () => {
    it('should return 200 and user roles for valid token', async () => {
      // Arrange
      const endpoint = '/api/auth/validate';

      // Act
      const response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${validToken}`)
        .expect('Content-Type', /json/);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data).toHaveProperty('permissions');
      expect(response.body.data).toHaveProperty('payload');
    });

    /**
     * Test: Invalid Token Validation Test
     * Requirement: Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
     * Description: Ensures that the token validation endpoint returns an error for invalid JWT tokens.
     */
    it('should return 401 for invalid token', async () => {
      // Arrange
      const endpoint = '/api/auth/validate';

      // Act
      const response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect('Content-Type', /json/);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token validation failed');
    });

    it('should return 401 for missing authorization header', async () => {
      // Arrange
      const endpoint = '/api/auth/validate';

      // Act
      const response = await request(app)
        .post(endpoint)
        .expect('Content-Type', /json/);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No authorization token provided');
    });
  });

  /**
   * Test: Request Validation Tests
   * Requirement: Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
   * Description: Ensures that request validation works correctly for both login and token validation.
   */
  describe('Request Validation', () => {
    it('should validate auth request format', () => {
      // Arrange & Act
      const validResult = validateAuthRequest(validCredentials);
      const invalidResult = validateAuthRequest(invalidCredentials);

      // Assert
      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });

    it('should validate token request format', () => {
      // Arrange & Act
      const validResult = validateTokenRequest({ token: validToken });
      const invalidResult = validateTokenRequest({ token: invalidToken });

      // Assert
      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });
  });
});