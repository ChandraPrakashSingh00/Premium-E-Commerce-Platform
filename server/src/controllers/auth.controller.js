import { authService } from '../services/auth.service.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ACCESS_COOKIE, REFRESH_COOKIE, accessCookieOptions, refreshCookieOptions } from '../utils/tokens.js';

const clientContext = (req) => ({ userAgent: req.get('user-agent'), ip: req.ip });

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
};

const withoutMaxAge = ({ maxAge: _maxAge, ...options }) => options;

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, withoutMaxAge(accessCookieOptions()));
  res.clearCookie(REFRESH_COOKIE, withoutMaxAge(refreshCookieOptions()));
};

const sendSession = (res, result, message, created = false) => {
  setAuthCookies(res, result);
  const data = { user: result.user.toJSON() };
  return created ? sendCreated(res, data, message) : sendSuccess(res, { data, message });
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, clientContext(req));
  sendSession(res, result, 'Account created successfully', true);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, clientContext(req));
  sendSession(res, result, 'Signed in successfully');
});

export const adminLogin = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, clientContext(req), { adminOnly: true });
  sendSession(res, result, 'Signed in successfully');
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const result = await authService.refresh(req.cookies?.[REFRESH_COOKIE], clientContext(req));
    sendSession(res, result, 'Session refreshed');
  } catch (err) {
    // On a concurrent-refresh race the browser already holds the new cookies – keep them.
    if (err.code !== 'REFRESH_RACE') clearAuthCookies(res);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  sendSuccess(res, { message: 'Signed out successfully' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearAuthCookies(res);
  sendSuccess(res, { message: 'Signed out from all devices' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  sendSuccess(res, { data: { user: user.toJSON() } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  sendSuccess(res, { message: 'If an account exists for this email, a password reset link has been sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  clearAuthCookies(res);
  sendSuccess(res, { message: 'Password reset successfully. Please sign in with your new password' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body.token);
  sendSuccess(res, { data: { user: user.toJSON() }, message: 'Email verified successfully' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user.id);
  sendSuccess(res, { message: 'Verification email sent' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body, clientContext(req));
  sendSession(res, result, 'Password changed successfully');
});
