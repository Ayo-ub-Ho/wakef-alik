import { create } from 'zustand';
import {
  RestaurantProfile,
  CreateRestaurantProfilePayload,
  UpdateRestaurantProfilePayload,
} from '../types/models';
import {
  getRestaurantProfile,
  createRestaurantProfile,
  updateRestaurantProfile,
} from '../api/restaurant.api';
import { AxiosError } from 'axios';

interface RestaurantState {
  profile: RestaurantProfile | null;
  loading: boolean;
  error: string | null;
}

interface RestaurantActions {
  fetchProfile: () => Promise<void>;
  saveProfile: (payload: CreateRestaurantProfilePayload | UpdateRestaurantProfilePayload) => Promise<void>;
  clearError: () => void;
}

type RestaurantStore = RestaurantState & RestaurantActions;

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
 * Restaurant Profile Store
 */
export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  /**
   * Fetch restaurant profile
   * If 404 => profile = null (not a fatal error)
   */
  fetchProfile: async () => {
    set({ loading: true, error: null });

    try {
      const profile = await getRestaurantProfile();
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
   * Save restaurant profile (create or update)
   * If profile is null => POST (create)
   * If profile exists => PATCH (update)
   */
  saveProfile: async (payload) => {
    set({ loading: true, error: null });

    try {
      const currentProfile = get().profile;
      let updatedProfile: RestaurantProfile;

      if (currentProfile === null) {
        // Create new profile
        updatedProfile = await createRestaurantProfile(payload as CreateRestaurantProfilePayload);
      } else {
        // Update existing profile
        updatedProfile = await updateRestaurantProfile(payload as UpdateRestaurantProfilePayload);
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
