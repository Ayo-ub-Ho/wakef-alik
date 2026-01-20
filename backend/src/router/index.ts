import { Router } from 'express';
import authRoutes from './auth.routes';
import driverRoutes from './driver.routes';
import restaurantRoutes from './restaurant.routes';
import requestRoutes from './request.routes';
import offerRoutes from './offer.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/driver', driverRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/requests', requestRoutes);
router.use('/', offerRoutes); // Mounts /offers/* and /requests/:id/status

export default router;
