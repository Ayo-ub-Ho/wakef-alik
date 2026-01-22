import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as driverService from '../services/driver.service';
import * as matchingService from '../services/matching.service';

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

/**
 * Get nearby delivery requests for driver
 * GET /api/driver/nearby-requests
 * Query params:
 *   - longitude: number (required)
 *   - latitude: number (required)
 *   - radius: number (optional, meters, default: 5000)
 *   - limit: number (optional, default: 20)
 */
export const getNearbyDeliveryRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const longitude = parseFloat(req.query.longitude as string);
        const latitude = parseFloat(req.query.latitude as string);
        const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : 5000;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

        // Validate coordinates
        if (isNaN(longitude) || isNaN(latitude)) {
            res.status(400).json({
                success: false,
                error: 'Valid longitude and latitude are required',
            });
            return;
        }

        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            res.status(400).json({
                success: false,
                error: 'Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90',
            });
            return;
        }

        const location = {
            type: 'Point' as const,
            coordinates: [longitude, latitude] as [number, number],
        };

        const requests = await matchingService.findNearbyDeliveryRequests(location, radius, limit);

        res.status(200).json({
            success: true,
            data: requests,
            meta: {
                count: requests.length,
                radius,
                location: { longitude, latitude },
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get nearby requests';
        res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
};
