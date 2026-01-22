import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from '../utils/env';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './tokenStorage';
import { parseTokensFromResponse } from '../types/api';

// Extend AxiosRequestConfig to track retry attempts
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Shared promise for token refresh to prevent parallel refresh calls
let refreshPromise: Promise<string | null> | null = null;

/**
 * Creates and configures the Axios client with JWT authentication
 * and automatic token refresh on 401 responses
 */
const createApiClient = (): AxiosInstance => {
  // Create axios instance with base configuration
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request Interceptor
   * Attaches the access token to outgoing requests if available
   */
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const accessToken = await getAccessToken();

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * Handles 401 errors by attempting token refresh and retrying the request
   */
  client.interceptors.response.use(
    // Success handler - pass through
    (response: AxiosResponse) => response,

    // Error handler - attempt refresh on 401
    async (error: AxiosError) => {
      const originalRequest = error.config as CustomAxiosRequestConfig;

      // Only attempt refresh if:
      // 1. We have a config to retry
      // 2. The error is a 401 Unauthorized
      // 3. We haven't already retried this request
      if (
        !originalRequest ||
        error.response?.status !== 401 ||
        originalRequest._retry
      ) {
        return Promise.reject(error);
      }

      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;

      try {
        // Wait for existing refresh or start a new one
        const newAccessToken = await handleTokenRefresh();

        if (newAccessToken) {
          // Update the authorization header with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request with new token
          return client(originalRequest);
        }

        // No token received, reject with original error
        return Promise.reject(error);
      } catch (refreshError) {
        // Refresh failed, clear tokens and reject
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }
  );

  return client;
};

/**
 * Handles token refresh with deduplication
 * Ensures only one refresh request is made even with multiple concurrent 401s
 * @returns The new access token or null if refresh failed
 */
const handleTokenRefresh = async (): Promise<string | null> => {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start new refresh and store the promise
  refreshPromise = performTokenRefresh();

  try {
    const result = await refreshPromise;
    return result;
  } finally {
    // Clear the shared promise so next refresh can proceed
    refreshPromise = null;
  }
};

/**
 * Performs the actual token refresh API call
 * @returns The new access token or null if refresh failed
 */
const performTokenRefresh = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    console.warn('No refresh token available for refresh');
    return null;
  }

  try {
    // Make refresh request WITHOUT using the interceptor-enabled client
    // to avoid circular dependency and infinite loops
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    // Parse tokens from response (handles multiple response shapes)
    const tokens = parseTokensFromResponse(response.data);

    if (tokens) {
      // Store the new tokens
      await setTokens(tokens.accessToken, tokens.refreshToken);
      console.log('Tokens refreshed successfully');
      return tokens.accessToken;
    }

    console.error('Failed to parse tokens from refresh response');
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// Export the configured client instance
const apiClient = createApiClient();

export default apiClient;
