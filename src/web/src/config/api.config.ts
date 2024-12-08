// Human Tasks:
// 1. Verify API_BASE_URL is correctly configured for the deployment environment
// 2. Ensure authentication token storage mechanism meets security requirements
// 3. Test API request timeout and retry configurations
// 4. Validate error handling and response interceptors

// axios version ^1.3.4
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { palette } from './theme.config';

/**
 * Base URL for API requests
 * Addresses API Integration requirement from Technical Specifications/2.3 API Design/API Specifications
 */
export const API_BASE_URL = 'https://api.estatekit.com';

/**
 * Retrieves the base URL for API requests
 * @returns {string} The base URL for API requests
 */
export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};

/**
 * Retrieves the stored authentication token for API requests
 * @returns {string} The authentication token
 */
export const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token');
  
  // Validate token format (JWT format check)
  if (token && /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
    return token;
  }
  
  return '';
};

/**
 * Creates and configures an axios instance for API requests
 * @param {AxiosRequestConfig} config - The axios configuration object
 * @returns {Promise<AxiosResponse>} The response from the API
 */
export const makeRequest = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  // Create axios instance with default configuration
  const instance: AxiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000, // 30 second timeout
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Use theme colors for progress indicators
    validateStatus: (status) => status >= 200 && status < 300,
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 401:
            // Handle unauthorized access
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
            break;
          case 403:
            // Handle forbidden access
            window.location.href = '/forbidden';
            break;
          case 404:
            // Handle not found
            window.location.href = '/not-found';
            break;
          case 500:
            // Handle server error
            window.location.href = '/error';
            break;
        }
      }
      return Promise.reject(error);
    }
  );

  try {
    // Apply theme colors to loading indicators if present
    if (config.headers) {
      config.headers['X-Loading-Color'] = palette.primary.main;
    }

    // Make the API request
    const response = await instance(config);
    return response;
  } catch (error) {
    throw error;
  }
};