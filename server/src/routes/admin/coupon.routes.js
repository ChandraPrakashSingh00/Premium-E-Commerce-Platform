import { Router } from 'express';
import * as coupons from '../../controllers/admin/coupon.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import {
  couponStatusSchema,
  createCouponSchema,
  listCouponsQuery,
  updateCouponSchema,
} from '../../validators/coupon.validator.js';

const router = Router();

router.get('/', validate({ query: listCouponsQuery }), coupons.listCoupons);
router.post('/', validate({ body: createCouponSchema }), coupons.createCoupon);
router.get('/:id', validate({ params: idParam }), coupons.getCoupon);
router.patch('/:id', validate({ params: idParam, body: updateCouponSchema }), coupons.updateCoupon);
router.patch('/:id/status', validate({ params: idParam, body: couponStatusSchema }), coupons.setCouponStatus);
router.delete('/:id', validate({ params: idParam }), coupons.deleteCoupon);

export default router;
