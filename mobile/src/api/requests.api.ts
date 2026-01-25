import apiClient from './client';
import { DeliveryRequest, CreateRequestPayload } from '../types/models';

/**
 * Unwrap data from various API response shapes:
 * - { success: true, data: {...} }
 * - { success: true, message: "...", data: {...} }
 * - { data: {...} }
 * - Direct object
 */
function unwrapData<T>(response: unknown): T {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response');
  }

  const data = response as Record<string, unknown>;

  // Shape: { success: true, data: {...} } or { success: true, message: "...", data: {...} }
  if (data.success === true && data.data !== undefined) {
    return data.data as T;
  }

  // Shape: { data: {...} }
  if (data.data !== undefined) {
    return data.data as T;
  }

  // Direct object (assume response is the data itself)
  return response as T;
}

/**
 * Unwrap array data from various API response shapes
 */
function unwrapArray<T>(response: unknown): T[] {
  const data = unwrapData<T[] | { items: T[] } | { requests: T[] }>(response);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if ('items' in data && Array.isArray(data.items)) {
      return data.items;
    }
    if ('requests' in data && Array.isArray(data.requests)) {
      return data.requests;
    }
  }
  return [];
}

/**
 * Get all delivery requests for the current restaurant
 */
export const getMyRequests = async (): Promise<DeliveryRequest[]> => {
  const response = await apiClient.get('/api/requests/my');
  return unwrapArray<DeliveryRequest>(response.data);
};

/**
 * Get a specific delivery request by ID
 */
export const getRequestById = async (id: string): Promise<DeliveryRequest> => {
  const response = await apiClient.get(`/api/requests/${id}`);
  return unwrapData<DeliveryRequest>(response.data);
};

/**
 * Create a new delivery request
 */
export const createRequest = async (
  payload: CreateRequestPayload
): Promise<DeliveryRequest> => {
  const response = await apiClient.post('/api/requests', payload);
  return unwrapData<DeliveryRequest>(response.data);
};

/**
 * Cancel a delivery request (only PENDING or PROPOSED status)
 */
export const cancelRequest = async (id: string): Promise<DeliveryRequest> => {
  const response = await apiClient.patch(`/api/requests/${id}/cancel`);
  return unwrapData<DeliveryRequest>(response.data);
};
