import { Router } from 'express';
import * as driverController from '../controllers/driver.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateDriverProfile } from '../middleware/validator.middleware';

const router = Router();

/**
 * @route   POST /api/driver/profile
 * @desc    Create driver profile
 * @access  Private (DRIVER only)
 */
router.post(
    '/profile',
    authenticate,
    requireRole('DRIVER'),
    validateDriverProfile,
    driverController.createProfile
);

/**
 * @route   GET /api/driver/profile
 * @desc    Get current driver's profile
 * @access  Private (DRIVER only)
 */
router.get('/profile', authenticate, requireRole('DRIVER'), driverController.getProfile);

/**
 * @route   PATCH /api/driver/profile
 * @desc    Update driver profile
 * @access  Private (DRIVER only)
 */
router.patch('/profile', authenticate, requireRole('DRIVER'), driverController.updateProfile);

/**
 * @route   GET /api/driver/available
 * @desc    Get all available drivers
 * @access  Private (ADMIN or RESTAURANT)
 */
router.get(
    '/available',
    authenticate,
    requireRole('ADMIN', 'RESTAURANT'),
    driverController.getAvailableDrivers
);

/**
 * @route   GET /api/driver/nearby-requests
 * @desc    Get nearby delivery requests from restaurants
 * @access  Private (DRIVER only)
 * @query   longitude - Driver's longitude (required)
 * @query   latitude - Driver's latitude (required)
 * @query   radius - Search radius in meters (optional, default: 5000)
 * @query   limit - Maximum results (optional, default: 20)
 */
router.get(
    '/nearby-requests',
    authenticate,
    requireRole('DRIVER'),
    driverController.getNearbyDeliveryRequests
);

export default router;
