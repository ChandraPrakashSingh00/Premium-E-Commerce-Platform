import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

// Operator injection is blocked at the edge (middleware/sanitize.js + zod validation),
// so trusted service code can freely use query operators.
mongoose.set('strictQuery', true);

let transactionsSupported = false;

export const supportsTransactions = () => transactionsSupported;

export async function connectDatabase(uri = env.MONGO_URI) {
  await mongoose.connect(uri, {
    maxPoolSize: env.isProd ? 50 : 10,
    serverSelectionTimeoutMS: 10_000,
    autoIndex: !env.isProd,
  });

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  transactionsSupported = Boolean(hello.setName || hello.msg === 'isdbgrid');

  if (!transactionsSupported) {
    logger.warn('MongoDB is not a replica set: multi-document transactions are disabled (atomic updates still prevent overselling).');
  }
  logger.info({ host: mongoose.connection.host, db: mongoose.connection.name }, 'MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}

export const isDatabaseReady = () => mongoose.connection.readyState === 1;
