import { admin } from './request';

export const inventoryApi = {
  list: (params) => admin.get('/inventory', params),
  adjust: (id, input) => admin.patch(`/inventory/${admin.id(id)}`, input),
  transactions: (params) => admin.get('/inventory/transactions', params),
};
