import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as restaurantService from '../services/restaurant.service';

/**
 * Create restaurant profile
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

        const profile = await restaurantService.createRestaurantProfile({
            userId: req.user.userId,
            ...req.body,
        });

        res.status(201).json({
            success: true,
            message: 'Restaurant profile created successfully',
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
 * Get restaurant profile
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

        const profile = await restaurantService.getRestaurantProfile(req.user.userId);

        if (!profile) {
            res.status(404).json({
                success: false,
                error: 'Restaurant profile not found',
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
 * Update restaurant profile
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

        const profile = await restaurantService.updateRestaurantProfile(req.user.userId, req.body);

        res.status(200).json({
            success: true,
            message: 'Restaurant profile updated successfully',
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
 * Get verified restaurants (public)
 */
export const getVerifiedRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const restaurants = await restaurantService.getVerifiedRestaurants();

        res.status(200).json({
            success: true,
            data: restaurants,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get restaurants';
        res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
};
