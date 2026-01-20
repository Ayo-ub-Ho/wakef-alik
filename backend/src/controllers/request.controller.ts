import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as requestService from '../services/request.service';
import { body, validationResult } from 'express-validator';

/**
 * Create a new delivery request
 * POST /api/requests
 */
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const request = await requestService.createDeliveryRequest({
            userId: req.user.userId,
            ...req.body,
        });

        res.status(201).json({
            success: true,
            message: 'Delivery request created successfully',
            data: request,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Request creation failed';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Get all requests for authenticated restaurant
 * GET /api/requests/my
 */
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const restaurantId = req.query.restaurantId as string | undefined;
        const requests = await requestService.getRestaurantRequests(req.user.userId, restaurantId);

        res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch requests';
        res.status(400).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Get a specific request by ID
 * GET /api/requests/:id
 */
export const getRequestById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const request = await requestService.getRequestById(requestId, req.user.userId);

        res.status(200).json({
            success: true,
            data: request,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch request';
        const statusCode = errorMessage.includes('permission') ? 403 : 404;
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
        });
    }
};

/**
 * Cancel a delivery request
 * PATCH /api/requests/:id/cancel
 */
export const cancelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const request = await requestService.cancelRequest(requestId, req.user.userId);

        res.status(200).json({
            success: true,
            message: 'Request cancelled successfully',
            data: request,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to cancel request';
        const statusCode = errorMessage.includes('permission') ? 403 : 400;
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
        });
    }
};
