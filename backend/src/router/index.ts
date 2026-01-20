import { Router } from 'express';
import authRoutes from './auth.routes';
import driverRoutes from './driver.routes';
import restaurantRoutes from './restaurant.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/driver', driverRoutes);
router.use('/restaurant', restaurantRoutes);

export default router;
