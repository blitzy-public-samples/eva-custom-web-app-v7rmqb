/**
 * Estate Kit - API Service
 * 
 * Requirements addressed:
 * - API Integration (Technical Specifications/2.3 API Design/API Specifications)
 *   Implements a centralized service for API communication, ensuring secure and consistent handling of requests and responses.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Ensures data integrity by validating API request and response data.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Secures API communication by integrating authentication tokens and role-based access control.
 * 
 * Human Tasks:
 * 1. Verify API endpoint configurations match backend specifications
 * 2. Test error handling scenarios for different API responses
 * 3. Validate authentication token handling with security team
 * 4. Review API request timeout settings for production environment
 */

// axios version ^1.3.4
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Internal imports
import { API_BASE_URL, makeRequest } from '../config/api.config';
import { validateAuth } from '../utils/validation.util';
import { formatDate } from '../utils/format.util';
import useAuth from '../hooks/useAuth';

/**
 * Interface for API request configuration
 * Extends AxiosRequestConfig with additional properties for Estate Kit
 */
interface ApiRequestConfig extends AxiosRequestConfig {
  requiresAuth?: boolean;
  validateResponse?: boolean;
  formatDates?: boolean;
}

/**
 * Makes an API request with integrated authentication, validation, and formatting
 * @param config - Configuration object for the API request
 * @returns Promise resolving to the API response
 */
export const makeApiRequest = async <T = any>(
  config: ApiRequestConfig
): Promise<AxiosResponse<T>> => {
  try {
    // Default configuration
    const defaultConfig: Partial<ApiRequestConfig> = {
      baseURL: API_BASE_URL,
      requiresAuth: true,
      validateResponse: true,
      formatDates: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Merge configurations
    const finalConfig = {
      ...defaultConfig,
      ...config,
      headers: {
        ...defaultConfig.headers,
        ...config.headers
      }
    };

    // Handle authentication if required
    if (finalConfig.requiresAuth) {
      const { getToken, isAuthenticated } = useAuth();
      
      if (!isAuthenticated) {
        throw new Error('Authentication required for this request');
      }

      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Validate authentication token
      if (!validateAuth({ token, email: '', password: '', role: 'user' })) {
        throw new Error('Invalid authentication token');
      }

      // Attach token to headers
      finalConfig.headers.Authorization = `Bearer ${token}`;
    }

    // Format date fields in request data if needed
    if (finalConfig.formatDates && finalConfig.data) {
      const formatDatesInObject = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;

        return Object.entries(obj).reduce((acc, [key, value]) => {
          if (value instanceof Date) {
            acc[key] = formatDate(value);
          } else if (Array.isArray(value)) {
            acc[key] = value.map(item => formatDatesInObject(item));
          } else if (typeof value === 'object') {
            acc[key] = formatDatesInObject(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as any);
      };

      finalConfig.data = formatDatesInObject(finalConfig.data);
    }

    // Make the API request using the configured axios instance
    const response = await makeRequest(finalConfig);

    // Validate response if needed
    if (finalConfig.validateResponse && response.data) {
      // Add specific validation logic based on response type
      // This can be extended based on API response schemas
      if (typeof response.data !== 'object') {
        throw new Error('Invalid response format');
      }

      // Format dates in response if needed
      if (finalConfig.formatDates) {
        response.data = formatDatesInObject(response.data);
      }
    }

    return response;
  } catch (error) {
    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Handle specific HTTP error status codes
        switch (error.response.status) {
          case 401:
            throw new Error('Unauthorized: Please log in again');
          case 403:
            throw new Error('Forbidden: Insufficient permissions');
          case 404:
            throw new Error('Resource not found');
          case 422:
            throw new Error('Validation error: Please check your input');
          default:
            throw new Error(`API request failed: ${error.response.statusText}`);
        }
      } else if (error.request) {
        throw new Error('No response received from server');
      }
    }
    
    // Handle other types of errors
    throw error instanceof Error 
      ? error 
      : new Error('An unexpected error occurred');
  }
};