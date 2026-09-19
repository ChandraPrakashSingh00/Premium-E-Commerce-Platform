import bcrypt from 'bcryptjs';
import { NOTIFICATION_TYPE, ROLES, USER_STATUS } from '../constants/index.js';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { isDuplicateKeyError, randomToken, sha256 } from '../utils/helpers.js';
import { withTransaction } from '../utils/transaction.js';
import { notificationService } from './notification.service.js';
import { sessionService } from './session.service.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid email or password';
/** bcrypt hash (cost 12) of a random string; compared against when the email is unknown to equalise timing. */
const DUMMY_HASH = '$2b$12$9D3BDr4zqlJ86iXgXbL97eAyz7sBfWbNMBbpC9uyF5oiSsp4Z1CtW';

const assertNotBlocked = (user) => {
  if (user.status === USER_STATUS.BLOCKED) throw AppError.forbidden('Your account has been suspended');
};

/** Creates a single-use token; returns the raw value and the fields to persist (hash + expiry). */
const createOneTimeToken = (ttlMs) => {
  const raw = randomToken(32);
  return { raw, hash: sha256(raw), expires: new Date(Date.now() + ttlMs) };
};

async function sendVerificationEmail(user) {
  const token = createOneTimeToken(VERIFICATION_TTL_MS);
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerificationToken: token.hash, emailVerificationExpires: token.expires } },
  );
  await notificationService.sendEmail('emailVerification', user.email, { name: user.name, token: token.raw });
  return token.raw;
}

/** Invalidates every access token (tokenVersion) and refresh session of a user. */
async function revokeEverything(userId) {
  await withTransaction(async (session) => {
    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } }, { session });
    await sessionService.revokeAllForUser(userId, { session });
  });
}

export const authService = {
  /** @returns {Promise<{user, accessToken, refreshToken, verificationToken}>} */
  async register({ name, email, password, phone }, ctx) {
    if (await User.exists({ email })) throw AppError.conflict('An account with this email already exists');

    let user;
    try {
      user = await User.create({ name, email, password, phone, lastLoginAt: new Date() });
    } catch (err) {
      if (isDuplicateKeyError(err)) throw AppError.conflict('An account with this email already exists');
      throw err;
    }

    const verificationToken = await sendVerificationEmail(user);
    await notificationService.notify({
      userId: user._id,
      type: NOTIFICATION_TYPE.WELCOME,
      title: 'Welcome aboard!',
      message: `Hi ${user.name}, your account is ready. Happy shopping!`,
      link: '/shop',
      email: { template: 'welcome', to: user.email, data: { name: user.name } },
    });

    const tokens = await sessionService.issue(user, ctx);
    return { user, ...tokens, verificationToken };
  },

  /** Shared by customer and admin login. Credential errors are always the same generic 401. */
  async login({ email, password }, ctx, { adminOnly = false } = {}) {
    const user = await User.findOne({ email }).select('+password +tokenVersion');
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw AppError.unauthorized(INVALID_CREDENTIALS);
    }
    if (!(await user.comparePassword(password))) throw AppError.unauthorized(INVALID_CREDENTIALS);
    assertNotBlocked(user);
    if (adminOnly && user.role !== ROLES.ADMIN) throw AppError.forbidden('Admin access required');

    user.lastLoginAt = new Date();
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: user.lastLoginAt } });

    const tokens = await sessionService.issue(user, ctx);
    return { user, ...tokens };
  },

  refresh(refreshToken, ctx) {
    return sessionService.rotate(refreshToken, ctx);
  },

  logout(refreshToken) {
    return sessionService.revokeByToken(refreshToken);
  },

  logoutAll(userId) {
    return revokeEverything(userId);
  },

  async me(userId) {
    const user = await User.findById(userId);
    if (!user) throw AppError.unauthorized('Account no longer exists');
    return user;
  },

  /**
   * Always resolves (no user enumeration). Returns the raw token for internal callers/tests only;
   * it must never be sent in an HTTP response.
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ email }).select('name email status').lean();
    if (!user || user.status === USER_STATUS.BLOCKED) return null;

    const token = createOneTimeToken(RESET_TTL_MS);
    await User.updateOne({ _id: user._id }, { $set: { passwordResetToken: token.hash, passwordResetExpires: token.expires } });
    await notificationService.sendEmail('passwordReset', user.email, { name: user.name, token: token.raw });
    return token.raw;
  },

  async resetPassword(rawToken, password) {
    const user = await User.findOne({
      passwordResetToken: sha256(rawToken),
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');
    if (!user) throw AppError.badRequest('This password reset link is invalid or has expired');

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await revokeEverything(user._id);
  },

  async verifyEmail(rawToken) {
    const user = await User.findOneAndUpdate(
      { emailVerificationToken: sha256(rawToken), emailVerificationExpires: { $gt: new Date() } },
      { $set: { isEmailVerified: true }, $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } },
      { returnDocument: 'after' },
    );
    if (!user) throw AppError.badRequest('This verification link is invalid or has expired');
    return user;
  },

  async resendVerification(userId) {
    const user = await User.findById(userId).select('name email isEmailVerified').lean();
    if (!user) throw AppError.unauthorized('Account no longer exists');
    if (user.isEmailVerified) throw AppError.badRequest('Your email is already verified');
    return sendVerificationEmail(user);
  },

  /** Changes the password, revokes all sessions/tokens and returns a fresh session for the caller. */
  async changePassword(userId, { currentPassword, newPassword }, ctx) {
    const user = await User.findById(userId).select('+password +tokenVersion');
    if (!user) throw AppError.unauthorized('Account no longer exists');
    if (!(await user.comparePassword(currentPassword))) throw AppError.badRequest('Current password is incorrect');

    user.password = newPassword;
    await user.save();
    await revokeEverything(user._id);

    const fresh = await User.findById(user._id).select('+tokenVersion');
    const tokens = await sessionService.issue(fresh, ctx);
    return { user: fresh, ...tokens };
  },
};
