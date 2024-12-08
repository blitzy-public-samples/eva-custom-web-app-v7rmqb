// @testing-library/react version ^13.4.0
import { render, screen } from '@testing-library/react';
// jest version ^29.0.0
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Import components and hooks
import DelegateCard from './DelegateCard';
import useDelegate from '../../hooks/useDelegate';
import { mockApiRequest, validateTestData, formatTestOutput } from '../../utils/test.util';

// Mock the useDelegate hook
jest.mock('../../hooks/useDelegate');

// Mock store for testing
const mockStore = configureStore({
  reducer: {
    delegate: (state = { delegates: [], status: 'idle', error: null }) => state
  }
});

/**
 * Test suite for the DelegateCard component
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and rendering of the DelegateCard component.
 */
describe('DelegateCard Component', () => {
  // Mock delegate data for testing
  const mockDelegate = {
    delegateId: '123',
    ownerId: '456',
    role: 'admin',
    permissions: [
      {
        permissionId: 'perm1',
        resourceType: 'document',
        accessLevel: 'read'
      },
      {
        permissionId: 'perm2',
        resourceType: 'profile',
        accessLevel: 'write'
      }
    ],
    expiresAt: new Date('2024-12-31')
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (useDelegate as jest.Mock).mockReturnValue({
      delegates: [mockDelegate],
      status: 'idle',
      error: null,
      isLoading: false,
      isError: false
    });
  });

  /**
   * Tests the rendering of the DelegateCard component with mock data
   * Verifies that all delegate information is displayed correctly
   */
  describe('testDelegateCardRendering', () => {
    it('should render delegate information correctly', () => {
      // Validate test data
      expect(validateTestData(mockDelegate, {
        type: 'object',
        properties: {
          delegateId: { type: 'string' },
          role: { type: 'string' },
          permissions: { type: 'array' },
          expiresAt: { type: 'date' }
        },
        required: ['delegateId', 'role', 'permissions', 'expiresAt']
      })).toBe(true);

      // Render component
      render(
        <Provider store={mockStore}>
          <DelegateCard delegate={mockDelegate} />
        </Provider>
      );

      // Assert role is displayed
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();

      // Assert permissions are displayed
      expect(screen.getByText('Permissions')).toBeInTheDocument();
      expect(screen.getByText('document: read')).toBeInTheDocument();
      expect(screen.getByText('profile: write')).toBeInTheDocument();

      // Assert expiration date is displayed
      expect(screen.getByText('Expires')).toBeInTheDocument();
      const formattedDate = screen.getByText(/December 31, 2024/);
      expect(formattedDate).toBeInTheDocument();
    });

    it('should handle empty permissions array', () => {
      const delegateWithNoPermissions = {
        ...mockDelegate,
        permissions: []
      };

      render(
        <Provider store={mockStore}>
          <DelegateCard delegate={delegateWithNoPermissions} />
        </Provider>
      );

      expect(screen.getByText('Permissions')).toBeInTheDocument();
      expect(screen.queryByText('document: read')).not.toBeInTheDocument();
    });
  });

  /**
   * Tests the integration of DelegateCard with the useDelegate hook
   * Verifies that the component interacts correctly with the hook
   */
  describe('testDelegateCardIntegration', () => {
    it('should integrate with useDelegate hook', async () => {
      // Mock API request
      const apiResponse = await mockApiRequest({
        url: '/delegates/123',
        method: 'GET',
        data: mockDelegate
      });

      expect(apiResponse.status).toBe(200);
      expect(apiResponse.data).toEqual(mockDelegate);

      render(
        <Provider store={mockStore}>
          <DelegateCard delegate={mockDelegate} />
        </Provider>
      );

      // Verify hook integration
      expect(useDelegate).toHaveBeenCalled();
    });
  });

  /**
   * Tests the error handling capabilities of the DelegateCard component
   * Verifies that errors are handled gracefully
   */
  describe('testDelegateCardErrorHandling', () => {
    it('should handle invalid delegate data gracefully', () => {
      // Invalid delegate data missing required fields
      const invalidDelegate = {
        delegateId: '123',
        role: 'admin'
      };

      // Log formatted test output for debugging
      console.log(formatTestOutput({
        testCase: 'Invalid Delegate Data',
        input: invalidDelegate,
        expectedError: 'Invalid delegate data'
      }));

      // Verify data validation fails
      expect(validateTestData(invalidDelegate, {
        type: 'object',
        properties: {
          delegateId: { type: 'string' },
          role: { type: 'string' },
          permissions: { type: 'array' },
          expiresAt: { type: 'date' }
        },
        required: ['delegateId', 'role', 'permissions', 'expiresAt']
      })).toBe(false);

      // Component should not throw when rendered with invalid data
      expect(() => {
        render(
          <Provider store={mockStore}>
            <DelegateCard delegate={invalidDelegate as any} />
          </Provider>
        );
      }).not.toThrow();
    });

    it('should handle expired delegates', () => {
      const expiredDelegate = {
        ...mockDelegate,
        expiresAt: new Date('2020-12-31')
      };

      render(
        <Provider store={mockStore}>
          <DelegateCard delegate={expiredDelegate} />
        </Provider>
      );

      // Verify expired date is displayed with warning color
      const expirationDate = screen.getByText(/December 31, 2020/);
      expect(expirationDate).toHaveStyle({ color: 'warning.main' });
    });
  });
});