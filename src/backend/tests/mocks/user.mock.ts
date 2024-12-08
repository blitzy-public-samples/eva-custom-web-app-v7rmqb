/**
 * Estate Kit - User Mocks
 * Version: 1.0.0
 * 
 * This file provides mock data and utilities for testing user-related functionalities
 * in the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - User Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Supports testing of user management functionalities, including account creation,
 *   profile updates, and role management.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Provides mock data for testing role-based access control mechanisms.
 * 
 * Human Tasks:
 * 1. Verify that mock data aligns with the latest user schema requirements
 * 2. Ensure mock permissions match the current RBAC configuration
 * 3. Update mock data when new user properties are added to the system
 */

import { UserTypes } from '../../../src/types/user.types';
import { UserModel } from '../../../src/db/models/user.model';
import { createUser } from '../../../src/services/user.service';

// Mock user constants
const mockUserId = '12345';
const mockUserEmail = 'testuser@example.com';
const mockUserName = 'Test User';
const mockUserRole = 'owner';

/**
 * Returns a mock user object for testing purposes.
 * Implements requirement: User Management - Testing user data structures
 * 
 * @returns A mock user object conforming to UserTypes interface
 */
export const getMockUser = (): UserTypes => {
  return {
    userId: mockUserId,
    email: mockUserEmail,
    name: mockUserName,
    role: mockUserRole,
    permissions: [
      {
        permissionId: '67890',
        resourceType: 'document',
        accessLevel: 'manage',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permissionId: '12345',
        resourceType: 'profile',
        accessLevel: 'manage',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    subscriptions: [],
    documents: [],
    auditLogs: []
  };
};

/**
 * Mocks the findByEmail method of the UserModel.
 * Implements requirement: User Management - Testing user retrieval
 * 
 * @param email - The email address to search for
 * @returns Promise resolving to a mock UserModel instance if email matches, null otherwise
 */
export const mockFindByEmail = async (email: string): Promise<UserModel | null> => {
  if (email === mockUserEmail) {
    const mockUser = getMockUser();
    return {
      ...mockUser,
      findByEmail: jest.fn(),
      updateProfile: jest.fn(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as UserModel;
  }
  return null;
};

/**
 * Mocks the createUser function from the user service.
 * Implements requirement: User Management - Testing user creation
 * 
 * @param userData - The user data for creating a new user
 * @returns Promise resolving to a mock UserModel instance
 */
export const mockCreateUser = async (userData: UserTypes): Promise<UserModel> => {
  // Validate the user data structure
  if (!userData.email || !userData.name || !userData.role) {
    throw new Error('Invalid user data provided');
  }

  // Create a mock user model instance
  const mockUser: UserModel = {
    ...userData,
    userId: mockUserId,
    findByEmail: jest.fn(),
    updateProfile: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as UserModel;

  return mockUser;
};