import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import {
    validateRegistration,
    validateLogin,
    validateRefreshToken,
} from '../middleware/validator.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegistration, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateRefreshToken, authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user
 * @access  Public
 */
router.post('/logout', validateRefreshToken, authController.logout);

export default router;
