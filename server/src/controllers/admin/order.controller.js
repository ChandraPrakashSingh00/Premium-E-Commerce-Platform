import { adminOrderService } from '../../services/adminOrder.service.js';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listOrders = asyncHandler(async (req, res) => {
  sendPaginated(res, await adminOrderService.list(req.validatedQuery));
});

export const getOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminOrderService.detail(req.params.id) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await adminOrderService.updateStatus(req.params.id, req.body, req.user._id);
  sendSuccess(res, { data, message: 'Order status updated' });
});

export const updateTracking = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminOrderService.updateTracking(req.params.id, req.body), message: 'Tracking updated' });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const data = await adminOrderService.cancel(req.params.id, req.body.reason, req.user._id);
  sendSuccess(res, { data, message: 'Order cancelled' });
});

export const resolveReturn = asyncHandler(async (req, res) => {
  const data = await adminOrderService.resolveReturn(req.params.id, req.body, req.user._id);
  sendSuccess(res, { data, message: 'Return updated' });
});

export const refundOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminOrderService.refund(req.params.id, req.body), message: 'Refund initiated' });
});

export const markPaid = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminOrderService.markPaid(req.params.id), message: 'Payment marked as collected' });
});

export const updateNote = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminOrderService.setNote(req.params.id, req.body.adminNote), message: 'Note saved' });
});
