import { Router } from 'express';
import { listAvailableCoupons } from '../controllers/coupon.controller.js';

const router = Router();

router.get('/available', listAvailableCoupons);

export default router;
