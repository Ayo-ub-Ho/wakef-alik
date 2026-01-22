/**
 * API Types for the mobile application
 */

// Token pair returned by auth endpoints
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Possible response shapes from the refresh endpoint
// The backend may return tokens in different structures:
// a) { success: true, data: { accessToken, refreshToken } }
// b) { data: { accessToken, refreshToken } }
// c) { accessToken, refreshToken }

export interface RefreshResponseWithSuccess {
  success: true;
  data: TokenPair;
}

export interface RefreshResponseWithData {
  data: TokenPair;
}

export type RefreshResponse =
  | RefreshResponseWithSuccess
  | RefreshResponseWithData
  | TokenPair;

/**
 * Extracts TokenPair from various response shapes
 * @param response - The response object from refresh endpoint
 * @returns TokenPair or null if parsing fails
 */
export const parseTokensFromResponse = (response: unknown): TokenPair | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const data = response as Record<string, unknown>;

  // Shape a) { success: true, data: { accessToken, refreshToken } }
  if (data.success === true && data.data && typeof data.data === 'object') {
    const nested = data.data as Record<string, unknown>;
    if (typeof nested.accessToken === 'string' && typeof nested.refreshToken === 'string') {
      return {
        accessToken: nested.accessToken,
        refreshToken: nested.refreshToken,
      };
    }
  }

  // Shape b) { data: { accessToken, refreshToken } }
  if (data.data && typeof data.data === 'object') {
    const nested = data.data as Record<string, unknown>;
    if (typeof nested.accessToken === 'string' && typeof nested.refreshToken === 'string') {
      return {
        accessToken: nested.accessToken,
        refreshToken: nested.refreshToken,
      };
    }
  }

  // Shape c) { accessToken, refreshToken }
  if (typeof data.accessToken === 'string' && typeof data.refreshToken === 'string') {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  return null;
};

// Generic API response wrapper
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}
