/**
 * Estate Kit - Frontend Test Utilities
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements reusable utilities to streamline and standardize testing processes across the frontend application.
 * 
 * Human Tasks:
 * 1. Verify mock API response formats match actual API responses
 * 2. Confirm test data validation schemas are up to date
 * 3. Review test output formatting with QA team
 */

// jest v29.0.0
import { jest } from 'jest';
import { validateAuth } from './validation.util';
import { formatDate } from './format.util';
import { getCurrentDate } from './date.util';
import { theme } from '../config/theme.config';
import { API_BASE_URL } from '../config/api.config';

/**
 * Mocks an API request for testing purposes.
 * Simulates API responses with configurable data and status codes.
 * 
 * @param config - Configuration object for the mock request
 * @returns Promise resolving to a mocked API response
 */
export const mockApiRequest = async (config: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  status?: number;
  delay?: number;
  headers?: Record<string, string>;
}): Promise<{
  data: any;
  status: number;
  headers: Record<string, string>;
}> => {
  // Validate the config object
  if (!config.url) {
    throw new Error('URL is required for mockApiRequest');
  }

  // Set default values
  const method = config.method || 'GET';
  const status = config.status || 200;
  const delay = config.delay || 0;
  const headers = {
    'Content-Type': 'application/json',
    ...config.headers
  };

  // Simulate network delay if specified
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    // Construct mock response
    const response = {
      data: config.data || {},
      status,
      headers,
      config: {
        url: `${API_BASE_URL}${config.url}`,
        method,
        baseURL: API_BASE_URL,
        headers
      }
    };

    // Simulate error responses
    if (status >= 400) {
      throw {
        response,
        message: 'Mock API Error',
        isAxiosError: true
      };
    }

    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Validates test data against predefined schemas.
 * Ensures test data meets expected format and requirements.
 * 
 * @param data - The test data to validate
 * @param schema - The schema to validate against
 * @returns True if the data is valid, otherwise false
 */
export const validateTestData = (data: any, schema: {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}): boolean => {
  try {
    // Basic schema validation
    if (!schema.type || !schema.properties) {
      throw new Error('Invalid schema provided');
    }

    // Validate data type
    if (schema.type === 'object' && typeof data !== 'object') {
      return false;
    }

    // Validate required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          return false;
        }
      }
    }

    // Validate properties
    for (const [key, value] of Object.entries(data)) {
      const propertySchema = schema.properties[key];
      if (!propertySchema) continue;

      // Validate property type
      if (propertySchema.type === 'string' && typeof value !== 'string') {
        return false;
      }
      if (propertySchema.type === 'number' && typeof value !== 'number') {
        return false;
      }
      if (propertySchema.type === 'boolean' && typeof value !== 'boolean') {
        return false;
      }

      // Validate auth objects using validateAuth utility
      if (propertySchema.type === 'auth') {
        if (!validateAuth(value)) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Test data validation error:', error);
    return false;
  }
};

/**
 * Formats test outputs for better readability.
 * Standardizes test result presentation across the application.
 * 
 * @param output - The test output to format
 * @returns A formatted string representation of the test output
 */
export const formatTestOutput = (output: any): string => {
  try {
    // Handle null or undefined
    if (output === null || output === undefined) {
      return String(output);
    }

    // Handle Date objects
    if (output instanceof Date) {
      return formatDate(output);
    }

    // Handle arrays
    if (Array.isArray(output)) {
      return `[\n  ${output.map(item => formatTestOutput(item)).join(',\n  ')}\n]`;
    }

    // Handle objects
    if (typeof output === 'object') {
      const entries = Object.entries(output).map(([key, value]) => {
        return `  ${key}: ${formatTestOutput(value)}`;
      });
      return `{\n${entries.join(',\n')}\n}`;
    }

    // Handle primitive values
    return String(output);
  } catch (error) {
    console.error('Error formatting test output:', error);
    return String(output);
  }
};