import { Router } from 'express';
import * as settings from '../../controllers/admin/setting.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import { messagesQuery, updateMessageSchema, updateSettingsSchema } from '../../validators/setting.validator.js';

const router = Router();

router.get('/settings', settings.getSettings);
router.patch('/settings', validate({ body: updateSettingsSchema }), settings.updateSettings);
router.get('/messages', validate({ query: messagesQuery }), settings.listMessages);
router.patch('/messages/:id', validate({ params: idParam, body: updateMessageSchema }), settings.updateMessage);

export default router;
