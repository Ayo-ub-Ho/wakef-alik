import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await authService.register(req.body);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Login a user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await authService.login(req.body);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Refresh access token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokens,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
        res.status(401).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Logout a user
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);

        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Logout failed';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};
