import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Minimal in-process background task runner with retries and exponential backoff.
 * Used for fire-and-forget side effects (emails, notifications) so HTTP responses
 * are not blocked. For multi-instance deployments swap this for a Redis-backed
 * queue (e.g. BullMQ) behind the same `enqueue` interface.
 */
const pending = new Set();

export function enqueue(name, task, { retries = 3, baseDelayMs = 1000 } = {}) {
  const run = async () => {
    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
      try {
        return await task();
      } catch (err) {
        if (attempt > retries) {
          logger.error({ err, job: name, attempt }, 'Background job failed permanently');
          return undefined;
        }
        logger.warn({ job: name, attempt, message: err.message }, 'Background job failed, retrying');
        await new Promise((r) => {
          setTimeout(r, baseDelayMs * 2 ** (attempt - 1)).unref?.();
        });
      }
    }
    return undefined;
  };

  // In tests run inline so assertions can observe side effects deterministically.
  if (env.isTest) return run();

  const p = run().finally(() => pending.delete(p));
  pending.add(p);
  return undefined;
}

/** Resolves once all queued tasks settle (used on shutdown / in tests). */
export const drainQueue = () => Promise.allSettled([...pending]);
