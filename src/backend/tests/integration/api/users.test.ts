// @package supertest ^6.3.3
// @package jest ^29.0.0

import supertest from 'supertest';
import { createUserController, getUserByEmailController, updateUserProfileController } from '../../../src/api/controllers/users.controller';
import { validateUserRequest } from '../../../src/api/validators/users.validator';
import { authMiddleware } from '../../../src/api/middlewares/auth.middleware';
import { validateToken } from '../../../src/config/auth0';

// Mock Express app for testing
import express from 'express';
const app = express();

// Configure middleware and routes for testing
app.use(express.json());
app.use(authMiddleware);
app.post('/api/users', createUserController);
app.get('/api/users/:email', getUserByEmailController);
app.put('/api/users/:userId', updateUserProfileController);

const request = supertest(app);

/**
 * Human Tasks:
 * 1. Configure test database with appropriate test data
 * 2. Set up Auth0 test credentials and tokens
 * 3. Review test coverage requirements
 * 4. Configure test environment variables
 */

// Mock Auth0 token validation
jest.mock('../../../src/config/auth0', () => ({
  validateToken: jest.fn().mockResolvedValue({
    sub: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'owner',
    permissions: ['user:create', 'user:read', 'user:update']
  })
}));

describe('User API Integration Tests', () => {
  // Test data
  const mockUser = {
    email: 'test@example.com',
    name: 'Test User',
    role: 'owner',
    permissions: ['user:create', 'user:read', 'user:update']
  };

  const mockToken = 'Bearer test-jwt-token';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test: User Creation API Endpoint
   * Requirement: User Management
   * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
   * Description: Tests the functionality of user creation endpoint
   */
  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const response = await request
        .post('/api/users')
        .set('Authorization', mockToken)
        .send(mockUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', mockUser.email);
      expect(response.body.user).toHaveProperty('name', mockUser.name);
      expect(response.body.user).toHaveProperty('role', mockUser.role);
    });

    it('should reject user creation without authentication', async () => {
      const response = await request
        .post('/api/users')
        .send(mockUser);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate user data before creation', async () => {
      const invalidUser = {
        email: 'invalid-email',
        name: '',
        role: 'invalid-role'
      };

      const response = await request
        .post('/api/users')
        .set('Authorization', mockToken)
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid user data');
    });
  });

  /**
   * Test: Get User by Email API Endpoint
   * Requirement: User Management, Role-Based Access Control
   * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
   * Description: Tests the functionality of retrieving user by email
   */
  describe('GET /api/users/:email', () => {
    it('should retrieve user by email successfully', async () => {
      const response = await request
        .get(`/api/users/${encodeURIComponent(mockUser.email)}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User retrieved successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', mockUser.email);
    });

    it('should handle non-existent user', async () => {
      const response = await request
        .get('/api/users/nonexistent@example.com')
        .set('Authorization', mockToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should validate email format', async () => {
      const response = await request
        .get('/api/users/invalid-email')
        .set('Authorization', mockToken);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid email');
    });
  });

  /**
   * Test: Update User Profile API Endpoint
   * Requirement: User Management, Role-Based Access Control
   * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
   * Description: Tests the functionality of updating user profile
   */
  describe('PUT /api/users/:userId', () => {
    const userId = 'test-user-id';
    const updateData = {
      name: 'Updated Name',
      role: 'delegate'
    };

    it('should update user profile successfully', async () => {
      const response = await request
        .put(`/api/users/${userId}`)
        .set('Authorization', mockToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        name: '',
        role: 'invalid-role'
      };

      const response = await request
        .put(`/api/users/${userId}`)
        .set('Authorization', mockToken)
        .send(invalidUpdateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid profile data');
    });

    it('should require authentication for profile update', async () => {
      const response = await request
        .put(`/api/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate user ID format', async () => {
      const response = await request
        .put('/api/users/invalid-id')
        .set('Authorization', mockToken)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });
  });
});