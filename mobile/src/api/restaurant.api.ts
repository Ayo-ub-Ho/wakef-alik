import apiClient from './client';
import {
  RestaurantProfile,
  CreateRestaurantProfilePayload,
  UpdateRestaurantProfilePayload,
} from '../types/models';

/**
 * Unwrap data from various API response shapes:
 * - { success: true, data: {...} }
 * - { data: {...} }
 * - Direct object
 */
function unwrapData<T>(response: unknown): T {
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
}

/**
 * Unwrap array data from various API response shapes
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function unwrapArray<T>(response: unknown): T[] {
  const data = unwrapData<T[] | { items: T[] }>(response);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'items' in data) {
    return data.items;
  }
  return [];
}

/**
 * Get current restaurant's profile
 */
export const getRestaurantProfile = async (): Promise<RestaurantProfile> => {
  const response = await apiClient.get('/api/restaurant/profile');
  return unwrapData<RestaurantProfile>(response.data);
};

/**
 * Create a new restaurant profile
 */
export const createRestaurantProfile = async (
  payload: CreateRestaurantProfilePayload
): Promise<RestaurantProfile> => {
  const response = await apiClient.post('/api/restaurant/profile', payload);
  return unwrapData<RestaurantProfile>(response.data);
};

/**
 * Update existing restaurant profile
 */
export const updateRestaurantProfile = async (
  payload: UpdateRestaurantProfilePayload
): Promise<RestaurantProfile> => {
  const response = await apiClient.patch('/api/restaurant/profile', payload);
  return unwrapData<RestaurantProfile>(response.data);
};
