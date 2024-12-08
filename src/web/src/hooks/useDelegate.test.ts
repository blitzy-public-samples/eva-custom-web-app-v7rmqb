// jest v29.0.0
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import useDelegate from './useDelegate';
import { mockApiRequest, validateTestData } from '../utils/test.util';
import { fetchDelegates, addDelegate, editDelegate, removeDelegate } from '../redux/slices/delegateSlice';
import delegateReducer from '../redux/slices/delegateSlice';

/**
 * Requirements Addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality of the useDelegate hook,
 *   ensuring robust delegate management operations.
 */

// Mock delegate data for testing
const mockDelegate = {
  delegateId: '123',
  ownerId: '456',
  permissions: [
    {
      permissionId: 'perm123',
      resourceType: 'document',
      accessLevel: 'read'
    }
  ],
  role: 'delegate' as const,
  expiresAt: new Date('2024-12-31')
};

// Mock updated delegate data
const mockUpdates = {
  permissions: [
    {
      permissionId: 'perm456',
      resourceType: 'document',
      accessLevel: 'write'
    }
  ],
  expiresAt: new Date('2025-12-31')
};

// Setup test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      delegate: delegateReducer
    }
  });
};

// Wrapper component for providing Redux store
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={createTestStore()}>{children}</Provider>
);

describe('useDelegate Hook', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDelegate(), { wrapper });

    expect(result.current.delegates).toEqual([]);
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should fetch delegates successfully', async () => {
    // Mock API response
    mockApiRequest({
      url: '/delegates',
      method: 'GET',
      data: [mockDelegate]
    });

    const { result } = renderHook(() => useDelegate(), { wrapper });

    await act(async () => {
      await result.current.getDelegatesList();
    });

    expect(result.current.delegates).toEqual([mockDelegate]);
    expect(result.current.status).toBe('succeeded');
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch delegates error', async () => {
    // Mock API error
    mockApiRequest({
      url: '/delegates',
      method: 'GET',
      status: 500,
      data: { message: 'Server error' }
    });

    const { result } = renderHook(() => useDelegate(), { wrapper });

    await act(async () => {
      try {
        await result.current.getDelegatesList();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBeDefined();
  });

  it('should create new delegate successfully', async () => {
    // Validate test data
    expect(validateTestData(mockDelegate, {
      type: 'object',
      properties: {
        delegateId: { type: 'string' },
        ownerId: { type: 'string' },
        permissions: { type: 'array' },
        role: { type: 'string' },
        expiresAt: { type: 'date' }
      },
      required: ['delegateId', 'ownerId', 'permissions', 'role', 'expiresAt']
    })).toBe(true);

    // Mock API response
    mockApiRequest({
      url: '/delegates',
      method: 'POST',
      data: mockDelegate
    });

    const { result } = renderHook(() => useDelegate(), { wrapper });

    await act(async () => {
      const response = await result.current.createNewDelegate(mockDelegate);
      expect(response).toEqual(mockDelegate);
    });

    expect(result.current.delegates).toContainEqual(mockDelegate);
    expect(result.current.status).toBe('succeeded');
  });

  it('should update existing delegate successfully', async () => {
    // Mock API response
    mockApiRequest({
      url: `/delegates/${mockDelegate.delegateId}`,
      method: 'PUT',
      data: { ...mockDelegate, ...mockUpdates }
    });

    const { result } = renderHook(() => useDelegate(), { wrapper });

    await act(async () => {
      const response = await result.current.updateExistingDelegate(
        mockDelegate.delegateId,
        mockUpdates
      );
      expect(response).toEqual({ ...mockDelegate, ...mockUpdates });
    });

    expect(result.current.status).toBe('succeeded');
  });

  it('should delete delegate successfully', async () => {
    // Mock API response
    mockApiRequest({
      url: `/delegates/${mockDelegate.delegateId}`,
      method: 'DELETE'
    });

    const { result } = renderHook(() => useDelegate(), { wrapper });

    await act(async () => {
      await result.current.deleteExistingDelegate(mockDelegate.delegateId);
    });

    expect(result.current.delegates).not.toContainEqual(mockDelegate);
    expect(result.current.status).toBe('succeeded');
  });

  it('should find delegate by ID', async () => {
    // Setup initial state with a delegate
    const store = createTestStore();
    store.dispatch(fetchDelegates.fulfilled([mockDelegate], ''));

    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => (
        <Provider store={store}>{children}</Provider>
      )
    });

    const foundDelegate = result.current.findDelegateById(mockDelegate.delegateId);
    expect(foundDelegate).toEqual(mockDelegate);
  });

  it('should check if delegate exists', async () => {
    // Setup initial state with a delegate
    const store = createTestStore();
    store.dispatch(fetchDelegates.fulfilled([mockDelegate], ''));

    const { result } = renderHook(() => useDelegate(), {
      wrapper: ({ children }) => (
        <Provider store={store}>{children}</Provider>
      )
    });

    expect(result.current.doesDelegateExist(mockDelegate.delegateId)).toBe(true);
    expect(result.current.doesDelegateExist('nonexistent')).toBe(false);
  });

  it('should handle invalid delegate data', async () => {
    const invalidDelegate = {
      ...mockDelegate,
      delegateId: undefined // Invalid data
    };

    const { result } = renderHook(() => useDelegate(), { wrapper });

    await act(async () => {
      try {
        await result.current.createNewDelegate(invalidDelegate as any);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBe('Invalid delegate data provided');
      }
    });

    expect(result.current.status).toBe('failed');
  });
});