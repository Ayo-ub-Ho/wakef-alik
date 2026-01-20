import { Router } from 'express';
import * as restaurantController from '../controllers/restaurant.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRestaurantProfile } from '../middleware/validator.middleware';

const router = Router();

/**
 * @route   POST /api/restaurant/profile
 * @desc    Create restaurant profile
 * @access  Private (RESTAURANT only)
 */
router.post(
    '/profile',
    authenticate,
    requireRole('RESTAURANT'),
    validateRestaurantProfile,
    restaurantController.createProfile
);

/**
 * @route   GET /api/restaurant/profile
 * @desc    Get current restaurant's profile
 * @access  Private (RESTAURANT only)
 */
router.get('/profile', authenticate, requireRole('RESTAURANT'), restaurantController.getProfile);

/**
 * @route   PATCH /api/restaurant/profile
 * @desc    Update restaurant profile
 * @access  Private (RESTAURANT only)
 */
router.patch(
    '/profile',
    authenticate,
    requireRole('RESTAURANT'),
    restaurantController.updateProfile
);

/**
 * @route   GET /api/restaurant/verified
 * @desc    Get all verified restaurants
 * @access  Public
 */
router.get('/verified', restaurantController.getVerifiedRestaurants);

export default router;
