import apiClient from './client';
import { DeliveryRequest, CreateRequestPayload } from '../types/models';

/**
 * Extracts data from various API response shapes:
 * - { success: true, data: {...} }
 * - { data: {...} }
 * - Direct object
 */
const extractData = <T>(response: unknown): T => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response');
  }

  const data = response as Record<string, unknown>;

  // Shape: { success: true, data: {...} }
  if (data.success === true && data.data !== undefined) {
    return data.data as T;
  }

  // Shape: { data: {...} }
  if (data.data !== undefined) {
    return data.data as T;
  }

  // Direct object (assume response is the data itself)
  return response as T;
};

/**
 * Get all delivery requests for the current restaurant
 */
export const getMyRequests = async (): Promise<DeliveryRequest[]> => {
  const response = await apiClient.get('/api/requests/my');
  return extractData<DeliveryRequest[]>(response.data);
};

/**
 * Get a specific delivery request by ID
 */
export const getRequestById = async (id: string): Promise<DeliveryRequest> => {
  const response = await apiClient.get(`/api/requests/${id}`);
  return extractData<DeliveryRequest>(response.data);
};

/**
 * Create a new delivery request
 */
export const createRequest = async (
  payload: CreateRequestPayload
): Promise<DeliveryRequest> => {
  const response = await apiClient.post('/api/requests', payload);
  return extractData<DeliveryRequest>(response.data);
};

/**
 * Cancel a delivery request (only PENDING or PROPOSED status)
 */
export const cancelRequest = async (id: string): Promise<DeliveryRequest> => {
  const response = await apiClient.patch(`/api/requests/${id}/cancel`);
  return extractData<DeliveryRequest>(response.data);
};
