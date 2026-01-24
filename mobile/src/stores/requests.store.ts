import { create } from 'zustand';
import { DeliveryRequest, CreateRequestPayload } from '../types/models';
import {
  getMyRequests,
  getRequestById,
  createRequest,
  cancelRequest,
} from '../api/requests.api';
import { AxiosError } from 'axios';

interface RequestsState {
  requests: DeliveryRequest[];
  current: DeliveryRequest | null;
  loading: boolean;
  error: string | null;
}

interface RequestsActions {
  fetchMyRequests: () => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  create: (payload: CreateRequestPayload) => Promise<DeliveryRequest>;
  cancel: (id: string) => Promise<void>;
  clearError: () => void;
  clearCurrent: () => void;
}

type RequestsStore = RequestsState & RequestsActions;

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
 * Requests Store (Restaurant scope)
 */
export const useRequestsStore = create<RequestsStore>((set, get) => ({
  requests: [],
  current: null,
  loading: false,
  error: null,

  /**
   * Fetch all requests for the current restaurant
   */
  fetchMyRequests: async () => {
    set({ loading: true, error: null });

    try {
      const requests = await getMyRequests();
      set({ requests, loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
    }
  },

  /**
   * Fetch a specific request by ID
   */
  fetchRequestById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const request = await getRequestById(id);
      set({ current: request, loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
    }
  },

  /**
   * Create a new delivery request
   */
  create: async (payload: CreateRequestPayload) => {
    set({ loading: true, error: null });

    try {
      const newRequest = await createRequest(payload);
      
      // Add to local list
      const currentRequests = get().requests;
      set({
        requests: [newRequest, ...currentRequests],
        loading: false,
        error: null,
      });

      return newRequest;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  /**
   * Cancel a delivery request
   */
  cancel: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const cancelledRequest = await cancelRequest(id);

      // Update in local list
      const currentRequests = get().requests;
      const updatedRequests = currentRequests.map((req) =>
        req._id === id ? { ...req, status: 'CANCELLED' as const } : req
      );

      set({
        requests: updatedRequests,
        current: cancelledRequest,
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
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear current request
   */
  clearCurrent: () => {
    set({ current: null });
  },
}));
