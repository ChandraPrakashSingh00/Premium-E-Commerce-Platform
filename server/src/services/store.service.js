import { env } from '../config/env.js';
import { ContactMessage, NewsletterSubscriber } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { isDuplicateKeyError } from '../utils/helpers.js';
import { paginate } from '../utils/pagination.js';
import { settingsService } from './settings.service.js';

/** { social: { instagram } } -> { 'social.instagram' } so partial nested updates don't wipe siblings. */
const toSetPaths = (obj, prefix = '') =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) Object.assign(acc, toSetPaths(value, path));
    else acc[path] = value;
    return acc;
  }, {});

export const storeService = {
  async publicSettings() {
    const settings = await settingsService.get();
    return { ...settingsService.toPublic(settings), razorpayEnabled: env.razorpayEnabled };
  },

  /** Idempotent: re-subscribing an existing email just re-activates it. */
  async subscribe({ email, source = 'footer' }) {
    const upsert = () =>
      NewsletterSubscriber.updateOne({ email }, { $set: { isActive: true }, $setOnInsert: { email, source } }, { upsert: true });
    try {
      await upsert();
    } catch (err) {
      // Two concurrent upserts can race on the unique index; the retry hits the existing doc.
      if (!isDuplicateKeyError(err)) throw err;
      await upsert();
    }
  },

  async createContactMessage(input) {
    const message = await ContactMessage.create(input);
    return { _id: message._id };
  },

  getSettings() {
    return settingsService.get();
  },

  updateSettings(changes) {
    return settingsService.update(toSetPaths(changes));
  },

  listMessages({ page, limit, status }) {
    return paginate(ContactMessage, status ? { status } : {}, { page, limit, sort: { createdAt: -1, _id: -1 } });
  },

  async updateMessageStatus(id, status) {
    const message = await ContactMessage.findByIdAndUpdate(id, { $set: { status } }, { returnDocument: 'after' }).lean();
    if (!message) throw AppError.notFound('Message not found');
    return message;
  },
};
