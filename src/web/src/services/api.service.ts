/**
 * Enhanced API Service Implementation
 * Version: 1.0.0
 * 
 * Core API service with comprehensive security, monitoring, and performance features
 * for the Estate Kit web application.
 * 
 * @package axios ^1.4.0
 */

import axios, { 
  AxiosInstance, 
  AxiosError, 
  AxiosRequestConfig, 
  AxiosResponse 
} from 'axios';
import { apiConfig } from '../config/api.config';
import { auth0Client } from '../config/auth.config';
import { AuthErrorType } from '../types/auth.types';

// Interfaces for enhanced type safety
interface MetricsData {
  timestamp: number;
  duration: number;
  status: number;
  endpoint: string;
  correlationId: string;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private circuitBreaker: CircuitBreakerState;
  private metricsBuffer: MetricsData[];

  constructor() {
    this.initializeAxiosInstance();
    this.initializeCircuitBreaker();
    this.metricsBuffer = [];
  }

  /**
   * Initializes Axios instance with enhanced security and monitoring features
   */
  private initializeAxiosInstance(): void {
    this.axiosInstance = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: apiConfig.headers,
      withCredentials: true
    });

    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }

  /**
   * Configures request interceptors for security and monitoring
   */
  private setupRequestInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Circuit breaker check
        if (this.isCircuitBreakerOpen()) {
          throw new Error('Circuit breaker is open');
        }

        // Add correlation ID for request tracing
        const correlationId = this.generateCorrelationId();
        config.headers['X-Correlation-ID'] = correlationId;

        // Validate and refresh authentication token
        const token = await this.getValidToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Validate MFA status if required
        await this.validateMFAStatus();

        // Add request timestamp for performance monitoring
        config.metadata = { startTime: Date.now() };

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Configures response interceptors for monitoring and error handling
   */
  private setupResponseInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Record metrics
        this.recordMetrics(response);

        // Validate response integrity
        this.validateResponse(response);

        // Reset circuit breaker on successful response
        this.resetCircuitBreaker();

        return response;
      },
      async (error) => {
        return this.handleApiError(error);
      }
    );
  }

  /**
   * Enhanced error handler with security context and monitoring
   */
  private async handleApiError(error: AxiosError): Promise<never> {
    // Update circuit breaker state
    this.updateCircuitBreakerState();

    // Extract error details
    const errorContext = {
      timestamp: new Date().toISOString(),
      correlationId: error.config?.headers?.['X-Correlation-ID'],
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    };

    // Classify error type
    const errorType = this.classifyError(error);

    // Handle token refresh for auth errors
    if (errorType === AuthErrorType.SESSION_EXPIRED) {
      try {
        await auth0Client.getTokenSilently();
        // Retry original request
        return this.axiosInstance(error.config!);
      } catch (refreshError) {
        // Force re-authentication
        await auth0Client.logout({ returnTo: window.location.origin });
      }
    }

    // Log error with security context
    console.error('API Error:', {
      ...errorContext,
      type: errorType,
      message: error.message
    });

    // Send error metrics
    this.recordErrorMetrics(errorContext);

    throw error;
  }

  /**
   * Performs GET request with enhanced security and monitoring
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw await this.handleApiError(error as AxiosError);
    }
  }

  /**
   * Performs POST request with enhanced security and monitoring
   */
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw await this.handleApiError(error as AxiosError);
    }
  }

  /**
   * Performs PUT request with enhanced security and monitoring
   */
  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw await this.handleApiError(error as AxiosError);
    }
  }

  /**
   * Performs DELETE request with enhanced security and monitoring
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw await this.handleApiError(error as AxiosError);
    }
  }

  /**
   * Validates and retrieves authentication token
   */
  private async getValidToken(): Promise<string | null> {
    try {
      return await auth0Client.getTokenSilently();
    } catch (error) {
      console.error('Token retrieval failed:', error);
      return null;
    }
  }

  /**
   * Validates MFA status if required
   */
  private async validateMFAStatus(): Promise<void> {
    try {
      const mfaStatus = await auth0Client.checkMFAStatus();
      if (!mfaStatus.verified) {
        throw new Error('MFA verification required');
      }
    } catch (error) {
      console.error('MFA validation failed:', error);
      throw error;
    }
  }

  /**
   * Circuit breaker implementation
   */
  private initializeCircuitBreaker(): void {
    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false
    };
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreaker.isOpen) return false;
    
    const resetTimeout = apiConfig.circuitBreakerConfig.resetTimeout;
    const now = Date.now();
    
    if (now - this.circuitBreaker.lastFailure > resetTimeout) {
      this.resetCircuitBreaker();
      return false;
    }
    
    return true;
  }

  private updateCircuitBreakerState(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    
    if (this.circuitBreaker.failures >= apiConfig.circuitBreakerConfig.failureThreshold) {
      this.circuitBreaker.isOpen = true;
    }
  }

  private resetCircuitBreaker(): void {
    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false
    };
  }

  /**
   * Monitoring and metrics
   */
  private recordMetrics(response: AxiosResponse): void {
    const startTime = response.config.metadata?.startTime;
    if (!startTime) return;

    const metrics: MetricsData = {
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      status: response.status,
      endpoint: response.config.url || '',
      correlationId: response.config.headers['X-Correlation-ID'] as string
    };

    this.metricsBuffer.push(metrics);
    this.flushMetricsIfNeeded();
  }

  private recordErrorMetrics(errorContext: any): void {
    // Implementation for error metrics recording
    // This would typically send metrics to a monitoring service
  }

  private flushMetricsIfNeeded(): void {
    if (this.metricsBuffer.length >= 10) {
      // Send metrics to monitoring service
      this.metricsBuffer = [];
    }
  }

  /**
   * Utility functions
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private classifyError(error: AxiosError): AuthErrorType {
    if (!error.response) return AuthErrorType.NETWORK_ERROR;
    
    switch (error.response.status) {
      case 401:
        return AuthErrorType.SESSION_EXPIRED;
      case 403:
        return AuthErrorType.MFA_REQUIRED;
      case 429:
        return AuthErrorType.ACCOUNT_LOCKED;
      default:
        return AuthErrorType.NETWORK_ERROR;
    }
  }

  private validateResponse(response: AxiosResponse): void {
    // Implement response validation logic
    // This could include checking response integrity, format, etc.
  }
}

// Export singleton instance
export const apiService = new ApiService();