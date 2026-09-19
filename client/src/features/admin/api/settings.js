import { admin } from './request';

export const settingsApi = {
  get: () => admin.get('/settings'),
  update: (input) => admin.patch('/settings', input),
  messages: (params) => admin.get('/messages', params),
  updateMessage: (id, status) => admin.patch(`/messages/${admin.id(id)}`, { status }),
};
