import jwt from 'jsonwebtoken';

export interface TokenPayload {
    userId: string;
    role: 'DRIVER' | 'RESTAURANT' | 'ADMIN';
}

export interface DecodedToken extends TokenPayload {
    iat: number;
    exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate an access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
    console.log('Generating access token with payload:', payload);
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
};

/**
 * Generate a refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
};

/**
 * Verify and decode an access token
 */
export const verifyAccessToken = (token: string): DecodedToken => {
    try {
        console.log('Verifying token:', token);
        return jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

/**
 * Verify and decode a refresh token
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Get token expiration times in seconds
 */
export const getTokenExpirations = () => {
    return {
        accessToken: JWT_EXPIRES_IN,
        refreshToken: JWT_REFRESH_EXPIRES_IN,
    };
};
