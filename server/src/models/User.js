import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../constants/index.js';

const BCRYPT_ROUNDS = 12;
const SENSITIVE = [
  'password',
  'tokenVersion',
  'emailVerificationToken',
  'emailVerificationExpires',
  'passwordResetToken',
  'passwordResetExpires',
  'passwordChangedAt',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: { type: String, trim: true, maxlength: 20 },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER, index: true },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE, index: true },
    avatar: { type: String, trim: true, maxlength: 1000 },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false, index: { sparse: true } },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false, index: { sparse: true } },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    /** Incremented to invalidate every issued access token (password change, logout-all, block). */
    tokenVersion: { type: Number, default: 0, select: false },

    preferences: {
      newsletter: { type: Boolean, default: false },
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        SENSITIVE.forEach((k) => delete ret[k]);
        delete ret.id;
        return ret;
      },
    },
  },
);

userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text' });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
