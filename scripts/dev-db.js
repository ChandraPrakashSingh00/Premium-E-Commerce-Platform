/**
 * Local development database.
 * Starts a single-node MongoDB replica set (so multi-document transactions work)
 * on 127.0.0.1:27017 using mongodb-memory-server, persisted under ./.dev-db.
 *
 * Usage: npm run dev:db   (keep it running, then `npm run dev` in another terminal)
 * Not for production – use MongoDB Atlas or a managed replica set there.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(path.join(root, 'server', 'package.json'));
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const port = Number(process.env.DEV_DB_PORT || 27017);
const dbPath = path.join(root, '.dev-db');
mkdirSync(dbPath, { recursive: true });

const replSet = await MongoMemoryReplSet.create({
  replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' },
  instanceOpts: [{ port, ip: '127.0.0.1', dbPath }],
});

console.log(`MongoDB replica set ready: mongodb://127.0.0.1:${port}/premium-ecommerce?replicaSet=rs0`);
console.log('Press Ctrl+C to stop.');

const shutdown = async () => {
  await replSet.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
