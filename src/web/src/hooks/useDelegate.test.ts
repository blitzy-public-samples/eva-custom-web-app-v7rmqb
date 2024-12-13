/**
 * Test Suite for useDelegate Custom Hook
 * Version: 1.0.0
 * 
 * Implements comprehensive testing for delegate management with enhanced security validation,
 * audit logging verification, and extensive error handling scenarios.
 * 
 * @package @testing-library/react-hooks ^8.0.1
 * @package @jest/globals ^29.0.0
 */

import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { useDelegate } from './useDelegate';
import { renderWithProviders, createMockStore } from '../utils/test.util';
import {
  Delegate,
  DelegateRole,
  DelegateStatus,
  CreateDelegateDTO,
  UpdateDelegateDTO,
  ResourceType,
  AccessLevel
} from '../types/delegate.types';

// Mock security context for testing
const mockSecurityContext = {
  userId: 'mock-user-uuid',
  mfaVerified: true,
  securityLevel: 'high',
  auditEnabled: true
};

// Mock delegate data
const mockDelegate: Delegate = {
  id: 'delegate-123',
  ownerId: mockSecurityContext.userId,
  delegateId: 'delegate-user-123',
  email: 'delegate@example.com',
  name: 'Test Delegate',
  role: DelegateRole.EXECUTOR,
  permissions: [
    {
      resourceType: ResourceType.PERSONAL_INFO,
      accessLevel: AccessLevel.READ
    }
  ],
  status: DelegateStatus.ACTIVE,
  expiresAt: new Date('2025-01-01'),
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock store setup with security state
const createMockStoreWithSecurity = () => {
  return createMockStore({
    initialState: {
      delegates: {
        items: [mockDelegate],
        status: 'idle',
        error: null,
        auditLog: []
      },
      auth: {
        user: {
          id: mockSecurityContext.userId,
          mfaVerified: mockSecurityContext.mfaVerified
        }
      }
    }
  });
};

describe('useDelegate Hook - Security and Audit Testing', () => {
  let mockStore: any;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockStore = createMockStoreWithSecurity();
    mockStore.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate delegate roles and permissions according to security matrix', async () => {
    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
    });

    // Test permission validation for executor role
    await act(async () => {
      const hasPermission = await result.current.validatePermissions(
        mockDelegate.id,
        'read.personal'
      );
      expect(hasPermission).toBe(true);
    });

    // Test write permission restriction
    await act(async () => {
      const hasWritePermission = await result.current.validatePermissions(
        mockDelegate.id,
        'write.personal'
      );
      expect(hasWritePermission).toBe(false);
    });
  });

  it('should enforce MFA verification for sensitive delegate operations', async () => {
    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => renderWithProviders(children, {
        store: createMockStore({
          initialState: {
            ...mockStore.getState(),
            auth: { user: { ...mockSecurityContext, mfaVerified: false } }
          }
        })
      })
    });

    // Attempt to create delegate without MFA
    const newDelegate: CreateDelegateDTO = {
      email: 'new@example.com',
      name: 'New Delegate',
      role: DelegateRole.HEALTHCARE_PROXY,
      permissions: [],
      expiresAt: new Date('2025-01-01')
    };

    await expect(result.current.createDelegate(newDelegate)).rejects.toThrow(
      'MFA verification required for delegate operations'
    );
  });

  it('should properly log audit events for delegate operations', async () => {
    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
    });

    // Create delegate and verify audit log
    const newDelegate: CreateDelegateDTO = {
      email: 'audit@example.com',
      name: 'Audit Test',
      role: DelegateRole.LEGAL_ADVISOR,
      permissions: [],
      expiresAt: new Date('2025-01-01')
    };

    await act(async () => {
      await result.current.createDelegate(newDelegate);
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'delegates/addAuditLogEntry',
        payload: expect.objectContaining({
          action: 'CREATE_DELEGATE',
          timestamp: expect.any(String)
        })
      })
    );
  });

  it('should handle security violations and permission errors', async () => {
    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
    });

    // Attempt to update delegate with invalid permissions
    const updateData: UpdateDelegateDTO = {
      role: DelegateRole.FINANCIAL_ADVISOR,
      permissions: [
        {
          resourceType: ResourceType.MEDICAL_DATA,
          accessLevel: AccessLevel.WRITE
        }
      ],
      expiresAt: new Date('2025-01-01'),
      status: DelegateStatus.ACTIVE
    };

    await expect(
      result.current.updateDelegate(mockDelegate.id, updateData)
    ).rejects.toThrow('Invalid permission level for role');
  });

  it('should maintain cache integrity and handle stale data', async () => {
    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
    });

    // Initial fetch
    await act(async () => {
      await result.current.fetchDelegates();
    });

    expect(result.current.cacheStatus).toBe('valid');

    // Force cache invalidation
    await act(async () => {
      await result.current.refreshCache();
    });

    expect(result.current.cacheStatus).toBe('valid');
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('should properly handle delegate removal with security checks', async () => {
    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
    });

    await act(async () => {
      await result.current.removeDelegate(mockDelegate.id);
    });

    // Verify audit log entry for removal
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'delegates/addAuditLogEntry',
        payload: expect.objectContaining({
          action: 'REMOVE_DELEGATE',
          documentId: mockDelegate.id
        })
      })
    );
  });

  it('should enforce role-based access control restrictions', async () => {
    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
    });

    // Test RBAC for different roles
    const roles = [
      DelegateRole.EXECUTOR,
      DelegateRole.HEALTHCARE_PROXY,
      DelegateRole.FINANCIAL_ADVISOR,
      DelegateRole.LEGAL_ADVISOR
    ];

    for (const role of roles) {
      const permissions = await result.current.validatePermissions(
        mockDelegate.id,
        `read.${role.toLowerCase()}`
      );
      expect(typeof permissions).toBe('boolean');
    }
  });
});