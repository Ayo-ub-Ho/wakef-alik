import crypto from 'crypto';
import { RefreshToken, IRefreshToken } from '../models/RefreshToken.model';
import { Types } from 'mongoose';

/**
 * Hash a token using SHA256
 */
const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a random token
 */
const generateRandomToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Create and store a refresh token
 */
export const createRefreshToken = async (userId: string): Promise<string> => {
    // Generate random token
    const token = generateRandomToken();
    const tokenHash = hashToken(token);

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store token in database
    await RefreshToken.create({
        userId: new Types.ObjectId(userId) as any,
        tokenHash,
        expiresAt,
    });

    return token;
};

/**
 * Validate a refresh token
 */
export const validateRefreshToken = async (
    token: string
): Promise<{ isValid: boolean; userId?: string }> => {
    const tokenHash = hashToken(token);

    // Find token in database
    const refreshToken = await RefreshToken.findOne({ tokenHash });

    if (!refreshToken) {
        return { isValid: false };
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
        return { isValid: false };
    }

    // Check if token is revoked
    if (refreshToken.revokedAt) {
        return { isValid: false };
    }

    return { isValid: true, userId: refreshToken.userId.toString() };
};

/**
 * Revoke a refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<boolean> => {
    const tokenHash = hashToken(token);

    const result = await RefreshToken.updateOne(
        { tokenHash },
        { revokedAt: new Date() }
    );

    return result.modifiedCount > 0;
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = async (userId: string): Promise<number> => {
    const result = await RefreshToken.updateMany(
        { userId: new Types.ObjectId(userId) as any, revokedAt: { $exists: false } },
        { revokedAt: new Date() }
    );

    return result.modifiedCount;
};

/**
 * Clean up expired tokens
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
    const result = await RefreshToken.deleteMany({
        expiresAt: { $lt: new Date() },
    });

    return result.deletedCount;
};
