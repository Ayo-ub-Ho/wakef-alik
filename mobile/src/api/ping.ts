import apiClient from './client';

/**
 * Pings the API to check if it's reachable
 * Uses the configured API client (no auth required for health check)
 * @returns Promise<{status: 'OK' | 'ERROR'}>
 */
export const pingAPI = async (): Promise<{ status: 'OK' | 'ERROR' }> => {
  try {
    const response = await apiClient.get('/api/health', {
      timeout: 5000,
    });

    if (response.status === 200) {
      return { status: 'OK' };
    }

    return { status: 'ERROR' };
  } catch (error) {
    console.error('Ping API Error:', error);
    return { status: 'ERROR' };
  }
};
