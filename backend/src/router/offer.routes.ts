import { Router } from 'express';
import * as offerController from '../controllers/offer.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   PATCH /api/driver/location
 * @desc    Update driver's current location
 * @access  Private (DRIVER only)
 */
router.patch('/driver/location', authenticate, requireRole('DRIVER'), offerController.updateLocation);

/**
 * @route   GET /api/driver/deliveries
 * @desc    Get driver's active deliveries
 * @access  Private (DRIVER only)
 */
router.get('/driver/deliveries', authenticate, requireRole('DRIVER'), offerController.getActiveDeliveries);

/**
 * @route   GET /api/offers/inbox
 * @desc    Get driver's inbox of pending offers
 * @access  Private (DRIVER only)
 */
router.get('/offers/inbox', authenticate, requireRole('DRIVER'), offerController.getInbox);

/**
 * @route   POST /api/offers/:offerId/accept
 * @desc    Accept a delivery offer
 * @access  Private (DRIVER only)
 */
router.post('/offers/:offerId/accept', authenticate, requireRole('DRIVER'), offerController.acceptOffer);

/**
 * @route   POST /api/offers/:offerId/reject
 * @desc    Reject a delivery offer
 * @access  Private (DRIVER only)
 */
router.post('/offers/:offerId/reject', authenticate, requireRole('DRIVER'), offerController.rejectOffer);

/**
 * @route   PATCH /api/requests/:id/status
 * @desc    Update delivery request status (driver only)
 * @access  Private (DRIVER only)
 */
router.patch('/requests/:id/status', authenticate, requireRole('DRIVER'), offerController.updateRequestStatus);

export default router;
