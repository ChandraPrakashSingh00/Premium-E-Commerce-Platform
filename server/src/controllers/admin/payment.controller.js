import { paymentService } from '../../services/payment.service.js';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listPayments = asyncHandler(async (req, res) => {
  sendPaginated(res, await paymentService.adminList(req.validatedQuery));
});

export const getPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await paymentService.adminGet(req.params.id) });
});
