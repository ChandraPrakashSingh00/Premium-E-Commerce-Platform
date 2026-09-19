import mongoose from 'mongoose';
import { supportsTransactions } from '../config/db.js';

/**
 * Runs `fn(session)` inside a MongoDB transaction when the deployment supports it
 * (replica set / Atlas). On standalone servers `fn(null)` runs without a session;
 * callers must therefore rely on atomic conditional updates for correctness and
 * use the transaction only as an extra all-or-nothing guarantee.
 *
 * Always pass `{ session }` to model operations inside `fn`.
 */
export async function withTransaction(fn) {
  if (!supportsTransactions()) return fn(null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
