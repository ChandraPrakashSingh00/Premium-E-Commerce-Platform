import { customerService } from '../../services/customer.service.js';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listCustomers = asyncHandler(async (req, res) => {
  sendPaginated(res, await customerService.list(req.validatedQuery));
});

export const getCustomer = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await customerService.detail(req.params.id) });
});

export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await customerService.updateStatus(req.user.id, req.params.id, req.body.status);
  sendSuccess(res, { data: customer, message: `Customer ${customer.status === 'blocked' ? 'blocked' : 'activated'}` });
});
