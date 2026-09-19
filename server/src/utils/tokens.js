import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'premium-ecommerce';

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role, tv: user.tokenVersion ?? 0 }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: ISSUER,
    audience: 'access',
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, audience: 'access', algorithms: ['HS256'] });

export const signRefreshToken = ({ userId, sessionId, family }) =>
  jwt.sign({ sub: String(userId), sid: String(sessionId), fam: family }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`,
    issuer: ISSUER,
    audience: 'refresh',
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: ISSUER, audience: 'refresh', algorithms: ['HS256'] });

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

const baseCookie = () => ({
  httpOnly: true,
  secure: env.isProd,
  // Client and API are usually on different sites in production (Vercel + Render),
  // which requires SameSite=None; the CSRF origin check in middleware/csrf.js covers that case.
  sameSite: env.isProd ? 'none' : 'lax',
  ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
});

const parseDurationMs = (value) => {
  const m = /^(\d+)([smhd])$/.exec(value);
  if (!m) return 15 * 60 * 1000;
  return Number(m[1]) * { s: 1e3, m: 6e4, h: 3.6e6, d: 8.64e7 }[m[2]];
};

export const accessCookieOptions = () => ({ ...baseCookie(), path: '/', maxAge: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN) });

export const refreshCookieOptions = () => ({
  ...baseCookie(),
  path: '/api/v1/auth',
  maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 8.64e7,
});

export const refreshExpiryDate = () => new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 8.64e7);
