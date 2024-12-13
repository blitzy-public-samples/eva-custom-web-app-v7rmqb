// @ts-check
import { v4 as uuidv4 } from 'uuid'; // Version: ^9.0.0
import {
  User,
  UserRole,
  UserStatus,
  CreateUserDTO,
  UpdateUserDTO,
  UserProfile
} from '../../src/types/user.types';

/**
 * Default mock user profile data with security and preference settings
 */
const DEFAULT_MOCK_PROFILE: UserProfile = {
  phoneNumber: '+1-555-123-4567',
  province: 'Ontario',
  mfaEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  timezone: 'America/Toronto',
  language: 'en',
  lastLoginAt: new Date(),
  auditEnabled: true
};

/**
 * Default mock user object with comprehensive security and profile settings
 */
const DEFAULT_MOCK_USER: User = {
  id: uuidv4(),
  email: 'test@estatekit.ca',
  name: 'Test User',
  profile: DEFAULT_MOCK_PROFILE,
  role: UserRole.OWNER,
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastPasswordChangeAt: new Date(),
  failedLoginAttempts: 0,
  currentSessionId: null
};

/**
 * Creates a mock user object with default or custom properties
 * Useful for testing user-related functionality including security features
 * 
 * @param overrides - Optional partial user object to override default values
 * @returns Complete mock user object with all required properties
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  const mockUser = {
    ...DEFAULT_MOCK_USER,
    id: uuidv4(), // Always generate a new UUID
    createdAt: new Date(), // Always use current timestamp
    updatedAt: new Date(),
    ...overrides
  };

  // Ensure profile is properly merged if provided in overrides
  mockUser.profile = {
    ...DEFAULT_MOCK_PROFILE,
    ...(overrides.profile || {})
  };

  return mockUser;
};

/**
 * Creates a mock user creation DTO with required and optional fields
 * Useful for testing user registration endpoints
 * 
 * @param overrides - Optional partial CreateUserDTO to override default values
 * @returns Mock CreateUserDTO object
 */
export const createMockCreateUserDTO = (overrides: Partial<CreateUserDTO> = {}): CreateUserDTO => {
  const mockCreateUserDTO: CreateUserDTO = {
    email: 'new.user@estatekit.ca',
    name: 'New Test User',
    province: 'Ontario',
    ...overrides
  };

  return mockCreateUserDTO;
};

/**
 * Creates a mock user update DTO with modifiable fields
 * Useful for testing user profile update endpoints
 * 
 * @param overrides - Optional partial UpdateUserDTO to override default values
 * @returns Mock UpdateUserDTO object
 */
export const createMockUpdateUserDTO = (overrides: Partial<UpdateUserDTO> = {}): UpdateUserDTO => {
  const mockUpdateUserDTO: UpdateUserDTO = {
    name: 'Updated Test User',
    profile: {
      phoneNumber: '+1-555-987-6543',
      emailNotifications: true,
      smsNotifications: true,
      mfaEnabled: true,
      timezone: 'America/Vancouver',
      language: 'fr'
    },
    status: UserStatus.ACTIVE,
    ...overrides
  };

  // Ensure profile is properly merged if provided in overrides
  if (overrides.profile) {
    mockUpdateUserDTO.profile = {
      ...mockUpdateUserDTO.profile,
      ...overrides.profile
    };
  }

  return mockUpdateUserDTO;
};

/**
 * Creates a mock user with a specific role for testing RBAC scenarios
 * 
 * @param role - UserRole to assign to the mock user
 * @param overrides - Optional additional overrides
 * @returns Mock user object with specified role
 */
export const createMockUserWithRole = (role: UserRole, overrides: Partial<User> = {}): User => {
  return createMockUser({
    role,
    ...overrides
  });
};

/**
 * Creates a mock suspended user for testing security scenarios
 * 
 * @param failedAttempts - Number of failed login attempts
 * @param overrides - Optional additional overrides
 * @returns Mock suspended user object
 */
export const createMockSuspendedUser = (failedAttempts: number = 5, overrides: Partial<User> = {}): User => {
  return createMockUser({
    status: UserStatus.SUSPENDED,
    failedLoginAttempts: failedAttempts,
    ...overrides
  });
};

/**
 * Creates a collection of mock users with different roles
 * Useful for testing delegate management and RBAC scenarios
 * 
 * @returns Array of mock users with different roles
 */
export const createMockUserCollection = (): User[] => {
  return [
    createMockUser({ role: UserRole.OWNER }),
    createMockUser({ role: UserRole.EXECUTOR }),
    createMockUser({ role: UserRole.HEALTHCARE_PROXY }),
    createMockUser({ role: UserRole.FINANCIAL_ADVISOR }),
    createMockUser({ role: UserRole.LEGAL_ADVISOR })
  ];
};