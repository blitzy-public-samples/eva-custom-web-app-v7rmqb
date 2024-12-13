// @ts-check
import { faker } from '@faker-js/faker'; // Version: ^8.0.0
import {
  UserRole,
  DelegateStatus,
  ResourceType,
  AccessLevel,
  CreateDelegateDTO
} from '../../src/types/delegate.types';

/**
 * Default expiry period for delegate access in days
 */
const DEFAULT_EXPIRY_DAYS = 365;

/**
 * Permission matrix defining default permissions for each delegate role
 * Based on authorization matrix from security specifications
 */
const ROLE_PERMISSION_MATRIX: Record<UserRole, Array<{ resourceType: ResourceType, accessLevel: AccessLevel }>> = {
  [UserRole.EXECUTOR]: [
    { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ }
  ],
  [UserRole.HEALTHCARE_PROXY]: [
    { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.MEDICAL_DATA, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ }
  ],
  [UserRole.FINANCIAL_ADVISOR]: [
    { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.READ }
  ],
  [UserRole.LEGAL_ADVISOR]: [
    { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ },
    { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.READ }
  ]
};

/**
 * Mock delegate entity for testing delegate-related functionality
 * Follows the Delegate interface structure with realistic test data
 */
export const mockDelegateEntity = {
  id: faker.string.uuid(),
  ownerId: faker.string.uuid(),
  delegateId: faker.string.uuid(),
  role: UserRole.EXECUTOR,
  status: DelegateStatus.ACTIVE,
  expiresAt: faker.date.future({ years: 1 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  lastAccessAt: faker.date.recent()
};

/**
 * Creates a mock delegate entity with optional overrides
 * Validates business rules and generates realistic test data
 * 
 * @param {Partial<typeof mockDelegateEntity>} overrides - Optional property overrides
 * @returns {typeof mockDelegateEntity} A mock delegate entity
 */
export const createMockDelegate = (overrides = {}) => {
  const now = new Date();
  const defaultDelegate = {
    id: faker.string.uuid(),
    ownerId: faker.string.uuid(),
    delegateId: faker.string.uuid(),
    role: UserRole.EXECUTOR,
    status: DelegateStatus.ACTIVE,
    expiresAt: faker.date.future({ years: 1 }),
    createdAt: faker.date.past(),
    updatedAt: now,
    lastAccessAt: faker.date.recent()
  };

  // Apply overrides with validation
  const mockDelegate = {
    ...defaultDelegate,
    ...overrides,
    // Ensure updatedAt is never before createdAt
    updatedAt: overrides.updatedAt || now
  };

  // Validate business rules
  if (mockDelegate.expiresAt < now) {
    throw new Error('Delegate expiration date cannot be in the past');
  }

  if (mockDelegate.updatedAt < mockDelegate.createdAt) {
    throw new Error('Updated date cannot be before created date');
  }

  if (mockDelegate.lastAccessAt && mockDelegate.lastAccessAt < mockDelegate.createdAt) {
    throw new Error('Last access date cannot be before created date');
  }

  return mockDelegate;
};

/**
 * Mock CreateDelegateDTO for testing delegate creation
 * Includes required fields with realistic test data
 */
export const mockCreateDelegateDTO: CreateDelegateDTO = {
  email: faker.internet.email(),
  role: UserRole.EXECUTOR,
  permissions: ROLE_PERMISSION_MATRIX[UserRole.EXECUTOR]
};

/**
 * Creates a mock CreateDelegateDTO with optional overrides
 * Validates permissions against authorization matrix
 * 
 * @param {Partial<CreateDelegateDTO>} overrides - Optional property overrides
 * @returns {CreateDelegateDTO} A mock delegate DTO
 */
export const createMockDelegateDTO = (overrides = {}): CreateDelegateDTO => {
  const role = overrides.role || UserRole.EXECUTOR;
  
  const defaultDTO = {
    email: faker.internet.email(),
    role,
    permissions: ROLE_PERMISSION_MATRIX[role]
  };

  // Apply overrides
  const mockDTO = {
    ...defaultDTO,
    ...overrides
  };

  // Validate email format
  if (!mockDTO.email.includes('@')) {
    throw new Error('Invalid email format in mock DTO');
  }

  // Validate permissions against role matrix
  if (mockDTO.permissions) {
    const validPermissions = ROLE_PERMISSION_MATRIX[mockDTO.role];
    const hasInvalidPermissions = mockDTO.permissions.some(permission => 
      !validPermissions.some(validPerm => 
        validPerm.resourceType === permission.resourceType &&
        validPerm.accessLevel === permission.accessLevel
      )
    );

    if (hasInvalidPermissions) {
      throw new Error('Invalid permissions for delegate role');
    }
  }

  return mockDTO;
};

/**
 * Generates a batch of mock delegates for testing pagination and filtering
 * 
 * @param {number} count - Number of mock delegates to generate
 * @param {Partial<typeof mockDelegateEntity>} baseOverrides - Base overrides for all delegates
 * @returns {Array<typeof mockDelegateEntity>} Array of mock delegates
 */
export const createMockDelegates = (count: number, baseOverrides = {}) => {
  return Array.from({ length: count }, () => createMockDelegate(baseOverrides));
};

/**
 * Generates a mock delegate with expired status for testing expiration handling
 * 
 * @returns {typeof mockDelegateEntity} An expired mock delegate
 */
export const createExpiredMockDelegate = () => {
  return createMockDelegate({
    status: DelegateStatus.EXPIRED,
    expiresAt: faker.date.past(),
  });
};

/**
 * Generates a mock delegate with pending status for testing invitation flows
 * 
 * @returns {typeof mockDelegateEntity} A pending mock delegate
 */
export const createPendingMockDelegate = () => {
  return createMockDelegate({
    status: DelegateStatus.PENDING,
    lastAccessAt: null
  });
};