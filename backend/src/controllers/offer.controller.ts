import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as offerService from '../services/offer.service';
import * as matchingService from '../services/matching.service';
import * as requestService from '../services/request.service';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Update driver's current location
 * PATCH /api/driver/location
 */
export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const driver = await offerService.updateDriverLocation(req.user.userId, req.body.location);

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: {
                currentLocation: driver.currentLocation,
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update location';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Get driver's inbox of pending offers
 * GET /api/offers/inbox
 */
export const getInbox = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const state = req.query.state as string | undefined;
        const offers = await offerService.getDriverInbox(req.user.userId, state);

        res.status(200).json({
            success: true,
            data: offers,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch offers';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Accept a delivery offer
 * POST /api/offers/:offerId/accept
 */
export const acceptOffer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        // Get driver profile to get driver ID
        const { DriverProfile } = await import('../models');
        const driver = await DriverProfile.findOne({ userId: req.user.userId as any });

        if (!driver) {
            res.status(404).json({
                success: false,
                error: 'Driver profile not found',
            });
            return;
        }

        const offerId = Array.isArray(req.params.offerId) ? req.params.offerId[0] : req.params.offerId;
        const result = await matchingService.acceptOffer(offerId, driver._id as any);

        if (!result.success) {
            res.status(409).json({
                success: false,
                error: result.message,
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.request,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to accept offer';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Reject a delivery offer
 * POST /api/offers/:offerId/reject
 */
export const rejectOffer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        // Get driver profile to get driver ID
        const { DriverProfile } = await import('../models');
        const driver = await DriverProfile.findOne({ userId: req.user.userId as any });

        if (!driver) {
            res.status(404).json({
                success: false,
                error: 'Driver profile not found',
            });
            return;
        }

        const offerId = Array.isArray(req.params.offerId) ? req.params.offerId[0] : req.params.offerId;
        const result = await matchingService.rejectOffer(offerId, driver._id as any);

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: result.message,
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reject offer';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Update delivery request status
 * PATCH /api/requests/:id/status
 */
export const updateRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        // Get driver profile to get driver ID
        const { DriverProfile } = await import('../models');
        const driver = await DriverProfile.findOne({ userId: req.user.userId as any });

        if (!driver) {
            res.status(404).json({
                success: false,
                error: 'Driver profile not found',
            });
            return;
        }

        const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const request = await requestService.updateRequestStatus(
            requestId,
            driver._id as any,
            req.body.status
        );

        res.status(200).json({
            success: true,
            message: 'Request status updated successfully',
            data: request,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
        const statusCode = errorMessage.includes('permission') || errorMessage.includes('not assigned') ? 403 : 400;
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Get driver's active deliveries
 * GET /api/driver/deliveries
 */
export const getActiveDeliveries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const deliveries = await offerService.getDriverDeliveries(req.user.userId);

        res.status(200).json({
            success: true,
            data: deliveries,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deliveries';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};
