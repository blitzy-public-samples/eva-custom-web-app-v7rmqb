// @package jest v29.0.0
import { authenticateUser, validateUserToken, updateUserProfile } from '../../src/services/auth.service';
import { validateAuthRequest } from '../../src/utils/validation.util';
import { logError } from '../../src/utils/logger.util';
import { validateToken } from '../../src/config/auth0';
import { UserTypes } from '../../src/types/user.types';

// Mock dependencies
jest.mock('../../src/utils/validation.util');
jest.mock('../../src/utils/logger.util');
jest.mock('../../src/config/auth0');

/**
 * Human Tasks:
 * 1. Configure test environment variables for Auth0 credentials
 * 2. Set up test database with mock user data
 * 3. Configure test encryption keys
 * 4. Review and update test coverage thresholds
 */

describe('Authentication Service Tests', () => {
  // Test data
  const mockUser: UserTypes = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: 'owner'
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  const mockPassword = 'TestPassword123!';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    /**
     * Tests the user authentication functionality
     * Requirement: Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
     */
    it('should successfully authenticate a valid user', async () => {
      // Mock dependencies
      (validateAuthRequest as jest.Mock).mockReturnValue(true);
      const mockAuthResult = {
        access_token: mockToken,
        refresh_token: 'refresh_token',
      };

      // Mock Auth0 client
      jest.spyOn(global as any, 'initializeAuth0').mockReturnValue({
        authClient: {
          passwordGrant: jest.fn().mockResolvedValue(mockAuthResult)
        }
      });

      // Mock user model
      jest.spyOn(global as any, 'UserModel').mockImplementation({
        findByEmail: jest.fn().mockResolvedValue(mockUser)
      });

      // Execute test
      const result = await authenticateUser(mockUser.email, mockPassword);

      // Verify results
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.profile).toEqual(expect.objectContaining({
        userId: mockUser.userId,
        email: mockUser.email,
        role: mockUser.role
      }));
      expect(validateAuthRequest).toHaveBeenCalledWith({
        username: mockUser.email,
        password: mockPassword
      });
    });

    it('should throw error for invalid authentication request', async () => {
      // Mock validation failure
      (validateAuthRequest as jest.Mock).mockReturnValue(false);

      // Execute and verify
      await expect(authenticateUser(mockUser.email, mockPassword))
        .rejects.toThrow('Invalid authentication request');
      expect(logError).toHaveBeenCalled();
    });
  });

  describe('validateUserToken', () => {
    /**
     * Tests the token validation functionality
     * Requirements:
     * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
     * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
     */
    it('should successfully validate a valid token', async () => {
      // Mock dependencies
      const mockDecodedToken = {
        sub: mockUser.userId,
        permissions: ['read:profile']
      };
      (validateToken as jest.Mock).mockResolvedValue(mockDecodedToken);

      // Mock user model
      jest.spyOn(global as any, 'UserModel').mockImplementation({
        findByPk: jest.fn().mockResolvedValue({
          ...mockUser,
          permissions: ['read:profile']
        })
      });

      // Execute test
      const result = await validateUserToken(mockToken);

      // Verify results
      expect(result).toBeDefined();
      expect(result.roles).toBe(mockUser.role);
      expect(result.payload).toEqual(mockDecodedToken);
      expect(validateToken).toHaveBeenCalledWith(mockToken);
    });

    it('should throw error for invalid token', async () => {
      // Mock token validation failure
      (validateToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Execute and verify
      await expect(validateUserToken(mockToken))
        .rejects.toThrow('Token validation failed');
      expect(logError).toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    /**
     * Tests the profile update functionality
     * Requirements:
     * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
     * - User Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
     */
    const mockProfileData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    it('should successfully update user profile', async () => {
      // Mock dependencies
      (validateAuthRequest as jest.Mock).mockReturnValue(true);

      // Mock user model
      jest.spyOn(global as any, 'UserModel').mockImplementation({
        updateProfile: jest.fn().mockResolvedValue(true)
      });

      // Execute test
      const result = await updateUserProfile(mockUser.userId, mockProfileData);

      // Verify results
      expect(result).toBe(true);
      expect(validateAuthRequest).toHaveBeenCalledWith(mockProfileData);
    });

    it('should return false for invalid profile data', async () => {
      // Mock validation failure
      (validateAuthRequest as jest.Mock).mockReturnValue(false);

      // Execute test
      const result = await updateUserProfile(mockUser.userId, mockProfileData);

      // Verify results
      expect(result).toBe(false);
      expect(logError).toHaveBeenCalled();
    });

    it('should handle profile update failure', async () => {
      // Mock dependencies
      (validateAuthRequest as jest.Mock).mockReturnValue(true);

      // Mock user model update failure
      jest.spyOn(global as any, 'UserModel').mockImplementation({
        updateProfile: jest.fn().mockResolvedValue(false)
      });

      // Execute test
      const result = await updateUserProfile(mockUser.userId, mockProfileData);

      // Verify results
      expect(result).toBe(false);
      expect(logError).toHaveBeenCalled();
    });
  });
});