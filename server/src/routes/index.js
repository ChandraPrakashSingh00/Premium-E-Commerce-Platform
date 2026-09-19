import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import reviewRoutes from './review.routes.js';
import couponRoutes from './coupon.routes.js';
import notificationRoutes from './notification.routes.js';
import storeRoutes from './store.routes.js';
import adminRoutes from './admin/index.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/store', storeRoutes);
router.use('/admin', adminRoutes);

export default router;
