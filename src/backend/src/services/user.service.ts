// @package auth0 v2.37.0
import { UserModel } from '../db/models/user.model';
import { validateUser } from '../utils/validation.util';
import { logInfo, logError } from '../utils/logger.util';
import { validateToken, getUserRoles as getAuth0UserRoles } from '../config/auth0';
import { validateUserRequest } from '../api/validators/users.validator';
import { UserTypes } from '../types/user.types';

/**
 * Human Tasks:
 * 1. Ensure Auth0 configuration is properly set up in the environment
 * 2. Verify database connection settings for user operations
 * 3. Review logging configuration for user-related events
 * 4. Confirm encryption keys are properly configured
 */

/**
 * Creates a new user in the system.
 * Requirements Addressed:
 * - User Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 * 
 * @param userData - The user data to create
 * @returns Promise resolving to the created user object
 */
export const createUser = async (userData: UserTypes): Promise<UserModel> => {
  try {
    // Validate user data using the validation utility
    if (!validateUser(userData)) {
      throw new Error('Invalid user data provided');
    }

    // Validate the request payload
    validateUserRequest(userData);

    // Log the user creation attempt
    logInfo(`Attempting to create user with email: ${userData.email}`);

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create the user in the database
    const user = await UserModel.create(userData);

    // Log successful user creation
    logInfo(`Successfully created user with ID: ${user.userId}`);

    return user;
  } catch (error) {
    logError(error as Error);
    throw error;
  }
};

/**
 * Retrieves a user by their email address.
 * Requirements Addressed:
 * - User Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 * 
 * @param email - The email address to search for
 * @returns Promise resolving to the user object if found, null otherwise
 */
export const getUserByEmail = async (email: string): Promise<UserModel | null> => {
  try {
    logInfo(`Attempting to retrieve user with email: ${email}`);

    const user = await UserModel.findByEmail(email);
    
    if (user) {
      logInfo(`Successfully retrieved user with ID: ${user.userId}`);
    } else {
      logInfo(`No user found with email: ${email}`);
    }

    return user;
  } catch (error) {
    logError(error as Error);
    throw error;
  }
};

/**
 * Updates the profile information of a user.
 * Requirements Addressed:
 * - User Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 * 
 * @param userId - The ID of the user to update
 * @param profileData - The profile data to update
 * @returns Promise resolving to true if successful, false otherwise
 */
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserTypes>
): Promise<boolean> => {
  try {
    // Validate the profile data
    if (!validateUser({ ...profileData, userId } as UserTypes)) {
      throw new Error('Invalid profile data provided');
    }

    logInfo(`Attempting to update profile for user ID: ${userId}`);

    // Update the user's profile
    const success = await UserModel.updateProfile(userId, profileData);

    if (success) {
      logInfo(`Successfully updated profile for user ID: ${userId}`);
    } else {
      logInfo(`Failed to update profile for user ID: ${userId}`);
    }

    return success;
  } catch (error) {
    logError(error as Error);
    throw error;
  }
};

/**
 * Authenticates a user using their JWT token.
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * 
 * @param token - The JWT token to validate
 * @returns Promise resolving to the decoded token payload
 */
export const authenticateUser = async (token: string): Promise<object> => {
  try {
    logInfo('Attempting to authenticate user with JWT token');

    // Validate the token using Auth0
    const decodedToken = await validateToken(token);

    logInfo('Successfully authenticated user');

    return decodedToken;
  } catch (error) {
    logError(error as Error);
    throw error;
  }
};

/**
 * Fetches the roles assigned to a user.
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 * 
 * @param userId - The ID of the user
 * @returns Promise resolving to an array of roles
 */
export const getUserRoles = async (userId: string): Promise<string[]> => {
  try {
    logInfo(`Attempting to fetch roles for user ID: ${userId}`);

    // Get user roles from Auth0
    const roles = await getAuth0UserRoles(userId);

    logInfo(`Successfully retrieved roles for user ID: ${userId}`);

    return roles.map(role => role.name);
  } catch (error) {
    logError(error as Error);
    throw error;
  }
};