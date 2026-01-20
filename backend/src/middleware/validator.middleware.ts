import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
        return;
    }

    next();
};

/**
 * Validation rules for user registration
 */
export const validateRegistration = [
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Must be a valid phone number'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),

    body('role')
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['DRIVER', 'RESTAURANT', 'ADMIN'])
        .withMessage('Role must be DRIVER, RESTAURANT, or ADMIN'),

    handleValidationErrors,
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors,
];

/**
 * Validation rules for refresh token
 */
export const validateRefreshToken = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),

    handleValidationErrors,
];

/**
 * Validation rules for driver profile creation
 */
export const validateDriverProfile = [
    body('vehicleType')
        .notEmpty()
        .withMessage('Vehicle type is required')
        .isIn(['BIKE', 'MOTORCYCLE', 'CAR', 'VAN'])
        .withMessage('Vehicle type must be BIKE, MOTORCYCLE, CAR, or VAN'),

    body('hasDeliveryBox')
        .optional()
        .isBoolean()
        .withMessage('hasDeliveryBox must be a boolean'),

    handleValidationErrors,
];

/**
 * Validation rules for restaurant profile creation
 */
export const validateRestaurantProfile = [
    body('restaurantName')
        .trim()
        .notEmpty()
        .withMessage('Restaurant name is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Restaurant name must be between 2 and 200 characters'),

    body('ownerName')
        .trim()
        .notEmpty()
        .withMessage('Owner name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Owner name must be between 2 and 100 characters'),

    body('addressText')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),

    body('location')
        .notEmpty()
        .withMessage('Location is required'),

    body('location.coordinates')
        .isArray({ min: 2, max: 2 })
        .withMessage('Location coordinates must be an array with [longitude, latitude]'),

    body('location.coordinates[0]')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),

    body('location.coordinates[1]')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),

    handleValidationErrors,
];
