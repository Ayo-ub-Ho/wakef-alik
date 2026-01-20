import { Router } from 'express';
import * as requestController from '../controllers/request.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/requests
 * @desc    Create a new delivery request
 * @access  Private (RESTAURANT only)
 */
router.post('/', authenticate, requireRole('RESTAURANT'), requestController.createRequest);

/**
 * @route   GET /api/requests/my
 * @desc    Get all requests for authenticated restaurant
 * @access  Private (RESTAURANT only)
 */
router.get('/my', authenticate, requireRole('RESTAURANT'), requestController.getMyRequests);

/**
 * @route   GET /api/requests/:id
 * @desc    Get a specific request by ID
 * @access  Private (RESTAURANT only)
 */
router.get('/:id', authenticate, requireRole('RESTAURANT'), requestController.getRequestById);

/**
 * @route   PATCH /api/requests/:id/cancel
 * @desc    Cancel a delivery request
 * @access  Private (RESTAURANT only)
 */
router.patch('/:id/cancel', authenticate, requireRole('RESTAURANT'), requestController.cancelRequest);

export default router;
