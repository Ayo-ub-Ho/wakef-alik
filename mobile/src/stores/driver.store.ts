import { create } from 'zustand';
import {
  DriverProfile,
  CreateDriverProfilePayload,
  UpdateDriverProfilePayload,
} from '../types/models';
import {
  getDriverProfile,
  createDriverProfile,
  updateDriverProfile,
} from '../api/driver.api';
import { AxiosError } from 'axios';

interface DriverState {
  profile: DriverProfile | null;
  loading: boolean;
  error: string | null;
}

interface DriverActions {
  fetchProfile: () => Promise<void>;
  saveProfile: (payload: CreateDriverProfilePayload | UpdateDriverProfilePayload) => Promise<void>;
  clearError: () => void;
}

type DriverStore = DriverState & DriverActions;

/**
 * Extracts error message from various error shapes
 */
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as AxiosError<{ message?: string; error?: string }>;
    
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
    }
    
    if ('message' in err && typeof err.message === 'string') {
      return err.message;
    }
  }
  
  return 'An unexpected error occurred';
};

/**
 * Driver Profile Store
 */
export const useDriverStore = create<DriverStore>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  /**
   * Fetch driver profile
   * If 404 => profile = null (not a fatal error)
   */
  fetchProfile: async () => {
    set({ loading: true, error: null });

    try {
      const profile = await getDriverProfile();
      set({ profile, loading: false, error: null });
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // 404 means no profile exists yet - not an error
      if (axiosError.response?.status === 404) {
        set({ profile: null, loading: false, error: null });
        return;
      }

      // Other errors
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
    }
  },

  /**
   * Save driver profile (create or update)
   * If profile is null => POST (create)
   * If profile exists => PATCH (update)
   */
  saveProfile: async (payload) => {
    set({ loading: true, error: null });

    try {
      const currentProfile = get().profile;
      let updatedProfile: DriverProfile;

      if (currentProfile === null) {
        // Create new profile
        updatedProfile = await createDriverProfile(payload as CreateDriverProfilePayload);
      } else {
        // Update existing profile
        updatedProfile = await updateDriverProfile(payload as UpdateDriverProfilePayload);
      }

      set({ profile: updatedProfile, loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
