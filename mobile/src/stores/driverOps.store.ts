import { create } from 'zustand';
import * as Location from 'expo-location';
import {
  GeoJSONPoint,
  NearbyRequest,
  RequestOffer,
  ActiveDelivery,
  DeliveryStatus,
} from '../types/models';
import {
  updateLocation,
  getNearbyRequests,
  getInbox,
  acceptOffer,
  rejectOffer,
  getActiveDeliveries,
  updateDeliveryStatus,
} from '../api/driver-ops.api';
import { AxiosError } from 'axios';

// Error types for location
export type LocationErrorType =
  | 'PERMISSION_DENIED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

interface DriverOpsState {
  currentLocation: GeoJSONPoint | null;
  lastSyncedAt: string | null;
  locationError: LocationErrorType | null;
  nearbyRequests: NearbyRequest[];
  inbox: RequestOffer[];
  activeDeliveries: ActiveDelivery[];
  loading: boolean;
  locationLoading: boolean;
  error: string | null;
}

interface DriverOpsActions {
  refreshLocation: () => Promise<GeoJSONPoint | null>;
  refreshLocationAndSync: () => Promise<GeoJSONPoint | null>;
  loadNearby: () => Promise<void>;
  loadInbox: () => Promise<void>;
  loadActiveDeliveries: () => Promise<void>;
  accept: (offerId: string) => Promise<void>;
  reject: (offerId: string) => Promise<void>;
  updateStatus: (requestId: string, status: DeliveryStatus) => Promise<void>;
  clearError: () => void;
  clearLocationError: () => void;
}

type DriverOpsStore = DriverOpsState & DriverOpsActions;

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
 * Driver Operations Store
 * Manages location, nearby requests, offers inbox, and active deliveries
 */
export const useDriverOpsStore = create<DriverOpsStore>((set, get) => ({
  currentLocation: null,
  lastSyncedAt: null,
  locationError: null,
  nearbyRequests: [],
  inbox: [],
  activeDeliveries: [],
  loading: false,
  locationLoading: false,
  error: null,

  /**
   * Refresh driver's GPS location and update on server
   * @deprecated Use refreshLocationAndSync instead
   */
  refreshLocation: async () => {
    return get().refreshLocationAndSync();
  },

  /**
   * Refresh driver's GPS location and sync with server
   * Handles permission, timeout, and network errors
   */
  refreshLocationAndSync: async () => {
    set({ locationLoading: true, locationError: null, error: null });

    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({
          locationLoading: false,
          locationError: 'PERMISSION_DENIED',
          error: 'Location permission denied. Please enable location access in settings.',
        });
        return null;
      }

      // Get current position with timeout
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
      });

      const point: GeoJSONPoint = {
        type: 'Point',
        coordinates: [location.coords.longitude, location.coords.latitude],
      };

      // Update location on server
      await updateLocation(point);

      set({
        currentLocation: point,
        lastSyncedAt: new Date().toISOString(),
        locationLoading: false,
        locationError: null,
        error: null,
      });

      return point;
    } catch (error) {
      const axiosError = error as AxiosError;
      let errorType: LocationErrorType = 'UNKNOWN';
      let message = 'Failed to update location';

      // Check for timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        errorType = 'TIMEOUT';
        message = 'Location request timed out. Please try again.';
      }
      // Check for network error
      else if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
        errorType = 'NETWORK_ERROR';
        message = 'Network error. Please check your connection.';
      }
      // Generic error
      else {
        message = getErrorMessage(error);
      }

      set({
        locationLoading: false,
        locationError: errorType,
        error: message,
      });
      return null;
    }
  },

  /**
   * Load nearby delivery requests
   * Requires currentLocation to be set first
   */
  loadNearby: async () => {
    const { currentLocation } = get();

    if (!currentLocation) {
      set({ error: 'Location not available. Please update your location first.' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const requests = await getNearbyRequests({
        longitude: currentLocation.coordinates[0],
        latitude: currentLocation.coordinates[1],
        radius: 5000,
        limit: 20,
      });

      set({ nearbyRequests: requests, loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
    }
  },

  /**
   * Load offer inbox (SENT offers)
   */
  loadInbox: async () => {
    set({ loading: true, error: null });

    try {
      const offers = await getInbox('SENT');
      set({ inbox: offers, loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
    }
  },

  /**
   * Load active deliveries
   */
  loadActiveDeliveries: async () => {
    set({ loading: true, error: null });

    try {
      const deliveries = await getActiveDeliveries();
      set({ activeDeliveries: deliveries, loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
    }
  },

  /**
   * Accept an offer
   */
  accept: async (offerId: string) => {
    set({ loading: true, error: null });

    try {
      await acceptOffer(offerId);

      // Remove from inbox
      const currentInbox = get().inbox;
      set({
        inbox: currentInbox.filter((o) => o._id !== offerId),
        loading: false,
        error: null,
      });

      // Refresh active deliveries
      get().loadActiveDeliveries();
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  /**
   * Reject an offer
   */
  reject: async (offerId: string) => {
    set({ loading: true, error: null });

    try {
      await rejectOffer(offerId);

      // Remove from inbox
      const currentInbox = get().inbox;
      set({
        inbox: currentInbox.filter((o) => o._id !== offerId),
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
   * Update delivery status (IN_DELIVERY, DELIVERED)
   */
  updateStatus: async (requestId: string, status: DeliveryStatus) => {
    set({ loading: true, error: null });

    try {
      await updateDeliveryStatus(requestId, status);

      // Refresh active deliveries to reflect new status
      await get().loadActiveDeliveries();

      set({ loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear location error state
   */
  clearLocationError: () => {
    set({ locationError: null });
  },
}));
