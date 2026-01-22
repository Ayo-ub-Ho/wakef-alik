import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../api/tokenStorage';

// User role types
export type UserRole = 'DRIVER' | 'RESTAURANT';

// User interface
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  loading: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthActions {
  hydrate: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Combined store type
type AuthStore = AuthState & AuthActions;

// Payload types
export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Response parser for flexible backend response shapes
interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Parses auth response from various possible shapes:
 * - { success: true, data: { user, accessToken, refreshToken } }
 * - { data: { user, accessToken, refreshToken } }
 * - { user, accessToken, refreshToken }
 */
const parseAuthResponse = (response: unknown): AuthResponseData | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const data = response as Record<string, unknown>;

  // Shape: { success: true, data: { ... } }
  if (data.success === true && data.data && typeof data.data === 'object') {
    const nested = data.data as Record<string, unknown>;
    if (nested.user && nested.accessToken && nested.refreshToken) {
      return {
        user: nested.user as User,
        accessToken: nested.accessToken as string,
        refreshToken: nested.refreshToken as string,
      };
    }
  }

  // Shape: { data: { ... } }
  if (data.data && typeof data.data === 'object') {
    const nested = data.data as Record<string, unknown>;
    if (nested.user && nested.accessToken && nested.refreshToken) {
      return {
        user: nested.user as User,
        accessToken: nested.accessToken as string,
        refreshToken: nested.refreshToken as string,
      };
    }
  }

  // Shape: { user, accessToken, refreshToken }
  if (data.user && data.accessToken && data.refreshToken) {
    return {
      user: data.user as User,
      accessToken: data.accessToken as string,
      refreshToken: data.refreshToken as string,
    };
  }

  return null;
};

/**
 * Extracts error message from various error shapes
 */
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // Axios error with response
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.message === 'string') return data.message;
        if (typeof data.error === 'string') return data.error;
      }
    }
    
    // Standard error
    if (typeof err.message === 'string') return err.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Zustand Auth Store with AsyncStorage persistence
 * Note: Only user and isAuthenticated are persisted
 * Tokens are stored separately in SecureStore
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      loading: false,
      error: null,

      /**
       * Hydrate: Check if tokens exist in SecureStore
       * Sets isAuthenticated based on token presence
       * Does NOT call backend - just checks local storage
       */
      hydrate: async () => {
        try {
          const accessToken = await getAccessToken();
          
          if (accessToken) {
            // Token exists, user is considered authenticated
            // The persist middleware will restore user data from AsyncStorage
            set({ isAuthenticated: true });
          } else {
            // No token, clear auth state
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Hydrate error:', error);
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isHydrated: true });
        }
      },

      /**
       * Register: Create new user account
       */
      register: async (payload: RegisterPayload) => {
        set({ loading: true, error: null });

        try {
          const response = await apiClient.post('/api/auth/register', payload);
          const authData = parseAuthResponse(response.data);

          if (!authData) {
            throw new Error('Invalid response from server');
          }

          // Save tokens to SecureStore
          await setTokens(authData.accessToken, authData.refreshToken);

          // Update store state
          set({
            user: authData.user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          const message = getErrorMessage(error);
          set({ loading: false, error: message });
          throw error;
        }
      },

      /**
       * Login: Authenticate existing user
       */
      login: async (payload: LoginPayload) => {
        set({ loading: true, error: null });

        try {
          const response = await apiClient.post('/api/auth/login', payload);
          const authData = parseAuthResponse(response.data);

          if (!authData) {
            throw new Error('Invalid response from server');
          }

          // Save tokens to SecureStore
          await setTokens(authData.accessToken, authData.refreshToken);

          // Update store state
          set({
            user: authData.user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          const message = getErrorMessage(error);
          set({ loading: false, error: message });
          throw error;
        }
      },

      /**
       * Logout: Sign out user and clear all auth data
       */
      logout: async () => {
        set({ loading: true, error: null });

        try {
          const refreshToken = await getRefreshToken();

          // Call logout endpoint (best effort, don't fail on error)
          if (refreshToken) {
            try {
              await apiClient.post('/api/auth/logout', { refreshToken });
            } catch (logoutError) {
              console.warn('Logout API call failed:', logoutError);
              // Continue with local logout even if API fails
            }
          }

          // Clear tokens from SecureStore
          await clearTokens();

          // Clear store state
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        } catch (error) {
          const message = getErrorMessage(error);
          set({ loading: false, error: message });
          // Still clear local state even on error
          await clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and isAuthenticated - NOT tokens
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
