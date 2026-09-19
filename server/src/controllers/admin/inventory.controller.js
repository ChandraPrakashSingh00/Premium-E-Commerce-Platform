import { inventoryService } from '../../services/inventory.service.js';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listInventory = asyncHandler(async (req, res) => {
  sendPaginated(res, await inventoryService.list(req.validatedQuery));
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const data = await inventoryService.adjust(req.params.id, req.body, { userId: req.user._id });
  sendSuccess(res, { data, message: 'Stock updated' });
});

export const listTransactions = asyncHandler(async (req, res) => {
  sendPaginated(res, await inventoryService.transactions(req.validatedQuery));
});
