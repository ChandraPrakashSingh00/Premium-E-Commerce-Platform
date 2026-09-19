import { http } from '@/services/apiClient';

export const authApi = {
  me: () => http.get('/auth/me').then((d) => d.user),
  login: (body) => http.post('/auth/login', body).then((d) => d.user),
  adminLogin: (body) => http.post('/auth/admin/login', body).then((d) => d.user),
  register: (body) => http.post('/auth/register', body).then((d) => d.user),
  logout: () => http.post('/auth/logout'),
  logoutAll: () => http.post('/auth/logout-all'),
  forgotPassword: (email) => http.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => http.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password }),
  verifyEmail: (token) => http.post('/auth/verify-email', { token }).then((d) => d.user),
  resendVerification: () => http.post('/auth/resend-verification'),
  changePassword: (body) => http.patch('/auth/change-password', body).then((d) => d.user),
};
