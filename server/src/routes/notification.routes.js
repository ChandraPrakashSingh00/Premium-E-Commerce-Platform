import { Router } from 'express';
import * as notifications from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { booleanish, idParam, paginationQuery } from '../validators/common.validator.js';

const router = Router();

const listQuery = paginationQuery.extend({ unreadOnly: booleanish.optional() });

router.use(authenticate);

router.get('/', validate({ query: listQuery }), notifications.listNotifications);
router.patch('/read-all', notifications.markAllRead);
router.patch('/:id/read', validate({ params: idParam }), notifications.markRead);
router.delete('/:id', validate({ params: idParam }), notifications.removeNotification);

export default router;
