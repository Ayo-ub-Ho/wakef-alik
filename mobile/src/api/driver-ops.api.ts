import apiClient from './client';
import {
  GeoJSONPoint,
  NearbyRequest,
  RequestOffer,
  ActiveDelivery,
  DeliveryStatus,
  DeliveryRequest,
} from '../types/models';
import { AxiosResponse } from 'axios';

/**
 * API module for driver operations
 */

/**
 * Helper to unwrap API responses
 * Supports: { success, data }, { data: { ... } }, or direct payload
 */
function unwrapData<T>(response: AxiosResponse): T {
  const payload = response.data;

  // Handle { success: true, data: ... }
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data as T;
  }

  // Handle { data: ... } wrapper
  if (payload && typeof payload === 'object' && 'data' in payload && !Array.isArray(payload)) {
    return payload.data as T;
  }

  // Direct payload
  return payload as T;
}

/**
 * Helper to unwrap array responses
 */
function unwrapArray<T>(response: AxiosResponse): T[] {
  const payload = response.data;

  // Direct array
  if (Array.isArray(payload)) {
    return payload;
  }

  // Handle { data: [...] }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

/**
 * Update driver's current location
 */
export const updateLocation = async (point: GeoJSONPoint): Promise<void> => {
  await apiClient.patch('/api/driver/location', { location: point });
};

/**
 * Params for fetching nearby requests
 */
export interface NearbyRequestsParams {
  longitude: number;
  latitude: number;
  radius?: number; // in meters
  limit?: number;
}

/**
 * Get nearby delivery requests based on driver's location
 */
export const getNearbyRequests = async (
  params: NearbyRequestsParams
): Promise<NearbyRequest[]> => {
  const response = await apiClient.get('/api/driver/nearby-requests', {
    params: {
      longitude: params.longitude,
      latitude: params.latitude,
      radius: params.radius || 5000,
      limit: params.limit || 20,
    },
  });

  return unwrapArray<NearbyRequest>(response);
};

/**
 * Get driver's offer inbox
 */
export const getInbox = async (state?: string): Promise<RequestOffer[]> => {
  const params: Record<string, string> = {};
  if (state) {
    params.state = state;
  }

  const response = await apiClient.get('/api/offers/inbox', { params });
  return unwrapArray<RequestOffer>(response);
};

/**
 * Accept an offer
 */
export const acceptOffer = async (offerId: string): Promise<RequestOffer> => {
  const response = await apiClient.post(`/api/offers/${offerId}/accept`);
  return unwrapData<RequestOffer>(response);
};

/**
 * Reject an offer
 */
export const rejectOffer = async (offerId: string): Promise<RequestOffer> => {
  const response = await apiClient.post(`/api/offers/${offerId}/reject`);
  return unwrapData<RequestOffer>(response);
};

/**
 * Get driver's active deliveries
 */
export const getActiveDeliveries = async (): Promise<ActiveDelivery[]> => {
  const response = await apiClient.get('/api/driver/deliveries');
  return unwrapArray<ActiveDelivery>(response);
};

/**
 * Update delivery status (IN_DELIVERY, DELIVERED)
 */
export const updateDeliveryStatus = async (
  requestId: string,
  status: DeliveryStatus
): Promise<DeliveryRequest> => {
  const response = await apiClient.patch(`/api/requests/${requestId}/status`, {
    status,
  });
  return unwrapData<DeliveryRequest>(response);
};
