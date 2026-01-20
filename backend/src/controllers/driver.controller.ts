import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as driverService from '../services/driver.service';

/**
 * Create driver profile
 */
export const createProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const profile = await driverService.createDriverProfile({
            userId: req.user.userId,
            ...req.body,
        });

        res.status(201).json({
            success: true,
            message: 'Driver profile created successfully',
            data: profile,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Profile creation failed';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Get driver profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const profile = await driverService.getDriverProfile(req.user.userId);

        if (!profile) {
            res.status(404).json({
                success: false,
                error: 'Driver profile not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
        res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Update driver profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const profile = await driverService.updateDriverProfile(req.user.userId, req.body);

        res.status(200).json({
            success: true,
            message: 'Driver profile updated successfully',
            data: profile,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Get available drivers (admin only)
 */
export const getAvailableDrivers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const drivers = await driverService.getAvailableDrivers();

        res.status(200).json({
            success: true,
            data: drivers,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get drivers';
        res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
};
