/**
 * Human Tasks:
 * 1. Ensure Auth0 configuration is properly set up in the environment
 * 2. Verify that email templates are configured in SendGrid for user notifications
 * 3. Review and update RBAC policies for user management endpoints
 * 4. Configure rate limiting for user-related API endpoints
 */

import { Request, Response } from 'express';
import { validateUserRequest } from '../validators/users.validator';
import { createUser, getUserByEmail, updateUserProfile } from '../../services/user.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';
import { validateRequestMiddleware } from '../middlewares/validation.middleware';
import { logError } from '../../utils/error.util';
import { UserTypes } from '../../types/user.types';

/**
 * Creates a new user in the system.
 * 
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements API endpoint for creating new user accounts with proper validation.
 * 
 * @param req - Express request object containing user data
 * @param res - Express response object
 */
export const createUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract user data from request body
    const userData: UserTypes = req.body;

    // Validate user data against schema
    if (!validateUserRequest(userData)) {
      res.status(400).json({
        error: 'Invalid user data',
        message: 'The provided user data failed validation'
      });
      return;
    }

    // Create new user
    const newUser = await createUser(userData);

    // Send success response
    res.status(201).json({
      message: 'User created successfully',
      user: {
        userId: newUser.userId,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    logError(error as Error);
    
    // Handle specific error cases
    if ((error as Error).message === 'User with this email already exists') {
      res.status(409).json({
        error: 'Duplicate user',
        message: 'A user with this email already exists'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user'
    });
  }
};

/**
 * Retrieves a user by their email address.
 * 
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements API endpoint for retrieving user information with proper authorization.
 * 
 * Requirement: Role-Based Access Control
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Enforces role-based access control for user data retrieval.
 * 
 * @param req - Express request object containing email parameter
 * @param res - Express response object
 */
export const getUserByEmailController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract email from request parameters
    const { email } = req.params;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Retrieve user by email
    const user = await getUserByEmail(email);

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided email address'
      });
      return;
    }

    // Send success response with user data
    res.status(200).json({
      message: 'User retrieved successfully',
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    logError(error as Error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user'
    });
  }
};

/**
 * Updates a user's profile information.
 * 
 * Requirement: User Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/User Management
 * Description: Implements API endpoint for updating user profile information.
 * 
 * Requirement: Data Validation
 * Location: Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture
 * Description: Ensures that user profile updates are validated against predefined schemas.
 * 
 * @param req - Express request object containing profile data
 * @param res - Express response object
 */
export const updateUserProfileController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract user ID and profile data
    const { userId } = req.params;
    const profileData: Partial<UserTypes> = req.body;

    // Validate user ID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
      return;
    }

    // Validate profile data
    if (!validateUserRequest({ ...profileData, userId } as UserTypes)) {
      res.status(400).json({
        error: 'Invalid profile data',
        message: 'The provided profile data failed validation'
      });
      return;
    }

    // Update user profile
    const success = await updateUserProfile(userId, profileData);

    if (!success) {
      res.status(404).json({
        error: 'Update failed',
        message: 'Failed to update user profile'
      });
      return;
    }

    // Send success response
    res.status(200).json({
      message: 'Profile updated successfully',
      userId: userId
    });
  } catch (error) {
    logError(error as Error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user profile'
    });
  }
};