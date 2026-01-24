import apiClient from './client';
import {
  DriverProfile,
  CreateDriverProfilePayload,
  UpdateDriverProfilePayload,
} from '../types/models';

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
 * Get current driver's profile
 */
export const getDriverProfile = async (): Promise<DriverProfile> => {
  const response = await apiClient.get('/api/driver/profile');
  return extractData<DriverProfile>(response.data);
};

/**
 * Create a new driver profile
 */
export const createDriverProfile = async (
  payload: CreateDriverProfilePayload
): Promise<DriverProfile> => {
  const response = await apiClient.post('/api/driver/profile', payload);
  return extractData<DriverProfile>(response.data);
};

/**
 * Update existing driver profile
 */
export const updateDriverProfile = async (
  payload: UpdateDriverProfilePayload
): Promise<DriverProfile> => {
  const response = await apiClient.patch('/api/driver/profile', payload);
  return extractData<DriverProfile>(response.data);
};
