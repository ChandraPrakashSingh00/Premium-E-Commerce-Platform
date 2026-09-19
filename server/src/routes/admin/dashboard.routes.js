import { Router } from 'express';
import * as dashboard from '../../controllers/admin/dashboard.controller.js';
import { validate } from '../../middleware/validate.js';
import { analyticsQuery, dashboardQuery } from '../../validators/analytics.validator.js';

const router = Router();

router.get('/dashboard', validate({ query: dashboardQuery }), dashboard.getDashboard);
router.get('/analytics', validate({ query: analyticsQuery }), dashboard.getAnalytics);

export default router;
