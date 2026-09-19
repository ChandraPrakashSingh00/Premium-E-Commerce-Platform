import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import dashboardRoutes from './dashboard.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';
import uploadRoutes from './upload.routes.js';
import inventoryRoutes from './inventory.routes.js';
import orderRoutes from './order.routes.js';
import customerRoutes from './customer.routes.js';
import reviewRoutes from './review.routes.js';
import couponRoutes from './coupon.routes.js';
import paymentRoutes from './payment.routes.js';
import settingRoutes from './setting.routes.js';

const router = Router();

// Every admin route requires an authenticated ADMIN.
router.use(requireAdmin);

router.use('/', dashboardRoutes); // /dashboard, /analytics
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/uploads', uploadRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/payments', paymentRoutes);
router.use('/', settingRoutes); // /settings, /messages

export default router;
