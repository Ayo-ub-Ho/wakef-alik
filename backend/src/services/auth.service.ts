import { User, IUser } from '../models/User.model';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { createRefreshToken, validateRefreshToken, revokeRefreshToken } from './token.service';

export interface RegisterInput {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'DRIVER' | 'RESTAURANT' | 'ADMIN';
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
    };
    tokens: AuthTokens;
}

/**
 * Register a new user
 */
export const register = async (input: RegisterInput): Promise<AuthResponse> => {
    const { fullName, email, phone, password, role } = input;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new Error('Email already registered');
        }
        if (existingUser.phone === phone) {
            throw new Error('Phone number already registered');
        }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
        fullName,
        email,
        phone,
        passwordHash,
        role,
        isActive: true,
    });

    // Generate tokens
    const tokenPayload = {
        userId: user._id.toString(),
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(user._id.toString());

    return {
        user: {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    };
};

/**
 * Login a user
 */
export const login = async (input: LoginInput): Promise<AuthResponse> => {
    const { email, password } = input;

    // Find user and include password hash
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
        throw new Error('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokenPayload = {
        userId: user._id.toString(),
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(user._id.toString());

    return {
        user: {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<AuthTokens> => {
    // Validate refresh token
    const validation = await validateRefreshToken(refreshToken);

    if (!validation.isValid || !validation.userId) {
        throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await User.findById(validation.userId);

    if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const tokenPayload = {
        userId: user._id.toString(),
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = await createRefreshToken(user._id.toString());

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
};

/**
 * Logout a user
 */
export const logout = async (refreshToken: string): Promise<void> => {
    await revokeRefreshToken(refreshToken);
};
