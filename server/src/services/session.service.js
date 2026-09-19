import mongoose from 'mongoose';
import { Session, User } from '../models/index.js';
import { USER_STATUS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { randomToken, sha256 } from '../utils/helpers.js';
import { refreshExpiryDate, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

const INVALID_SESSION = 'Session expired, please sign in again';
const ROTATION_GRACE_MS = 10_000;

const clientMeta = (ctx = {}) => ({
  userAgent: ctx.userAgent ? String(ctx.userAgent).slice(0, 400) : undefined,
  ip: ctx.ip ? String(ctx.ip).slice(0, 64) : undefined,
});

/**
 * Refresh-token sessions with rotation and reuse detection.
 * Only sha256(refreshToken) is persisted.
 */
export const sessionService = {
  /**
   * Creates a session and signs both tokens.
   * `user` must include `tokenVersion` (select '+tokenVersion').
   */
  async issue(user, ctx, { family = randomToken(16), sessionId = new mongoose.Types.ObjectId() } = {}) {
    const refreshToken = signRefreshToken({ userId: user._id, sessionId, family });
    await Session.create({
      _id: sessionId,
      user: user._id,
      tokenHash: sha256(refreshToken),
      family,
      expiresAt: refreshExpiryDate(),
      ...clientMeta(ctx),
    });
    return { accessToken: signAccessToken(user), refreshToken, sessionId };
  },

  revokeFamily(family) {
    return Session.updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } });
  },

  revokeAllForUser(userId, { session } = {}) {
    return Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } }, { session });
  },

  /** Revokes the session a refresh token belongs to (logout). Never throws on bad tokens. */
  async revokeByToken(refreshToken) {
    if (!refreshToken || typeof refreshToken !== 'string') return;
    await Session.updateOne({ tokenHash: sha256(refreshToken), revokedAt: null }, { $set: { revokedAt: new Date() } });
  },

  /**
   * Rotates a refresh token. A valid JWT whose session is missing or already
   * revoked means the token was replayed: the whole family is revoked.
   * @returns {Promise<{user, accessToken, refreshToken}>}
   */
  async rotate(refreshToken, ctx) {
    if (!refreshToken || typeof refreshToken !== 'string') throw AppError.unauthorized('Refresh token missing');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized(INVALID_SESSION);
    }

    const current = await Session.findOne({ tokenHash: sha256(refreshToken) }).lean();
    // Two tabs refreshing at the same moment: the other tab just rotated this token.
    // Don't treat it as theft – tell the client to retry with the cookies it now has.
    if (current?.revokedAt && current.replacedBy && Date.now() - current.revokedAt.getTime() < ROTATION_GRACE_MS) {
      throw new AppError('Session was refreshed by another request, retry', 401, [], 'REFRESH_RACE');
    }
    if (!current || current.revokedAt || String(current.user) !== payload.sub || current.family !== payload.fam) {
      await this.revokeFamily(payload.fam);
      throw AppError.unauthorized(INVALID_SESSION);
    }
    if (current.expiresAt <= new Date()) throw AppError.unauthorized(INVALID_SESSION);

    const user = await User.findById(current.user).select('+tokenVersion');
    if (!user) throw AppError.unauthorized(INVALID_SESSION);
    if (user.status === USER_STATUS.BLOCKED) {
      await this.revokeAllForUser(user._id);
      throw AppError.forbidden('Your account has been suspended');
    }

    // Claim the old session atomically; losing the race is treated as reuse.
    const nextId = new mongoose.Types.ObjectId();
    const claimed = await Session.updateOne(
      { _id: current._id, revokedAt: null },
      { $set: { revokedAt: new Date(), replacedBy: nextId } },
    );
    if (claimed.modifiedCount === 0) {
      await this.revokeFamily(current.family);
      throw AppError.unauthorized(INVALID_SESSION);
    }

    const tokens = await this.issue(user, ctx, { family: current.family, sessionId: nextId });
    return { user, ...tokens };
  },
};
