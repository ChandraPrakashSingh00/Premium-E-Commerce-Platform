import { checkoutService } from '../services/checkout.service.js';
import { orderService, toCustomerOrder } from '../services/order.service.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const quote = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await checkoutService.quote(req.user._id, req.body.paymentMethod) });
});

export const placeOrder = asyncHandler(async (req, res) => {
  const { order, payment, created } = await checkoutService.placeOrder(req.user, req.body, req.idempotencyKey);
  const data = { order: await toCustomerOrder(order), payment };
  if (created) return sendCreated(res, data, 'Order placed');
  return sendSuccess(res, { data, message: 'Order already placed' });
});

export const listOrders = asyncHandler(async (req, res) => {
  sendPaginated(res, await orderService.list(req.user._id, req.validatedQuery));
});

export const getOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await orderService.getById(req.user._id, req.params.id) });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const data = await orderService.cancel(req.user._id, req.params.id, req.body.reason);
  sendSuccess(res, { data, message: 'Order cancelled' });
});

export const requestReturn = asyncHandler(async (req, res) => {
  const data = await orderService.requestReturn(req.user._id, req.params.id, req.body);
  sendSuccess(res, { data, message: 'Return requested' });
});

export const retryPayment = asyncHandler(async (req, res) => {
  const { order, payment } = await checkoutService.retryPayment(req.user._id, req.params.id);
  sendSuccess(res, { data: { order: await toCustomerOrder(order), payment } });
});
