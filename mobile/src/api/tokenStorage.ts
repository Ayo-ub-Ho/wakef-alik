import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Retrieves the access token from secure storage
 * @returns The access token or null if not found
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Retrieves the refresh token from secure storage
 * @returns The refresh token or null if not found
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Stores both access and refresh tokens in secure storage
 * @param accessToken - The JWT access token
 * @param refreshToken - The refresh token for token rotation
 */
export const setTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  } catch (error) {
    console.error('Error setting tokens:', error);
    throw error;
  }
};

/**
 * Clears all tokens from secure storage (used on logout or refresh failure)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.error('Error clearing tokens:', error);
    throw error;
  }
};
