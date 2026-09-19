import mongoose from 'mongoose';

/**
 * Refresh-token session. Only a SHA-256 hash of the refresh token is stored.
 * Tokens rotate on every refresh; re-use of a rotated token revokes the whole family.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    userAgent: { type: String, maxlength: 400 },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
