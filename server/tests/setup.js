import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, inject } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = inject('mongoUri');
process.env.RAZORPAY_KEY_ID ??= 'rzp_test_dummykey';
process.env.RAZORPAY_KEY_SECRET ??= 'test_razorpay_secret';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'test_webhook_secret';

const { connectDatabase, disconnectDatabase } = await import('../src/config/db.js');
const models = await import('../src/models/index.js');
const { settingsService } = await import('../src/services/settings.service.js');

beforeAll(async () => {
  await connectDatabase(process.env.MONGO_URI);
  await Promise.all(
    Object.values(models)
      .filter((m) => m?.prototype instanceof mongoose.Model)
      .map((m) => m.syncIndexes()),
  );
});

beforeEach(async () => {
  settingsService.clearCache();
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await disconnectDatabase();
});
