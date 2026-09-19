import { User } from '../models/index.js';
import { ROLES, USER_STATUS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/tokens.js';

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.[ACCESS_COOKIE];
};

async function resolveUser(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw AppError.unauthorized(err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token');
  }
  const user = await User.findById(payload.sub).select('+tokenVersion').lean();
  if (!user) throw AppError.unauthorized('Account no longer exists');
  if (user.status === USER_STATUS.BLOCKED) throw AppError.forbidden('Your account has been suspended');
  if ((user.tokenVersion ?? 0) !== (payload.tv ?? 0)) throw AppError.unauthorized('Session expired');
  return { id: String(user._id), _id: user._id, role: user.role, email: user.email, name: user.name, isEmailVerified: user.isEmailVerified };
}

/** Requires a valid access token. Sets `req.user`. */
export async function authenticate(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next(AppError.unauthorized());
  req.user = await resolveUser(token);
  return next();
}

/** Attaches `req.user` when a valid token is present; never fails. */
export async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

/** Role-based authorization; use after `authenticate`. */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    return next();
  };

export const requireAdmin = [authenticate, authorize(ROLES.ADMIN)];
