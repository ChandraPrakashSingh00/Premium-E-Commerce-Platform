import { Address } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';

export const MAX_ADDRESSES = 10;
const LIST_SORT = { isDefault: -1, updatedAt: -1, _id: -1 };

const unsetOtherDefaults = (userId, keepId, session) =>
  Address.updateMany({ user: userId, _id: { $ne: keepId }, isDefault: true }, { $set: { isDefault: false } }, { session });

export const addressService = {
  list(userId) {
    return Address.find({ user: userId }).sort(LIST_SORT).lean();
  },

  async get(userId, id) {
    const address = await Address.findOne({ _id: id, user: userId }).lean();
    if (!address) throw AppError.notFound('Address not found');
    return address;
  },

  /** The first address is always the default; `isDefault: true` moves the default to the new one. */
  create(userId, input) {
    return withTransaction(async (session) => {
      const count = await Address.countDocuments({ user: userId }).session(session);
      if (count >= MAX_ADDRESSES) throw AppError.badRequest(`You can save up to ${MAX_ADDRESSES} addresses`);

      const isDefault = count === 0 || input.isDefault === true;
      const [address] = await Address.create([{ ...input, user: userId, isDefault }], { session });
      if (isDefault) await unsetOtherDefaults(userId, address._id, session);
      return address.toJSON();
    });
  },

  /** `isDefault: false` is ignored – the default can only move by making another address default. */
  update(userId, id, input) {
    const { isDefault, ...changes } = input;
    return withTransaction(async (session) => {
      const address = await Address.findOne({ _id: id, user: userId }).session(session);
      if (!address) throw AppError.notFound('Address not found');

      address.set(changes);
      if (isDefault === true) address.isDefault = true;
      await address.save({ session });
      if (isDefault === true) await unsetOtherDefaults(userId, address._id, session);
      return address.toJSON();
    });
  },

  /** Deleting the default promotes the most recently updated remaining address. */
  remove(userId, id) {
    return withTransaction(async (session) => {
      const removed = await Address.findOneAndDelete({ _id: id, user: userId }, { session }).lean();
      if (!removed) throw AppError.notFound('Address not found');
      if (removed.isDefault) {
        await Address.findOneAndUpdate(
          { user: userId },
          { $set: { isDefault: true } },
          { sort: { updatedAt: -1, _id: -1 }, session },
        );
      }
    });
  },

  async setDefault(userId, id) {
    await withTransaction(async (session) => {
      const res = await Address.updateOne({ _id: id, user: userId }, { $set: { isDefault: true } }, { session });
      if (!res.matchedCount) throw AppError.notFound('Address not found');
      await unsetOtherDefaults(userId, id, session);
    });
    return this.list(userId);
  },
};
