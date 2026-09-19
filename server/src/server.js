import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { createApp } from './app.js';
import { startJobs, stopJobs } from './jobs/index.js';

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on ${env.SERVER_URL} (port ${env.PORT}, ${env.NODE_ENV})`);
  });
  server.keepAliveTimeout = 65_000;
  startJobs();

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    stopJobs();
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

bootstrap().catch((err) => {
  if (!env.isProd && /ECONNREFUSED/.test(err?.message)) {
    logger.fatal(
      `Cannot reach MongoDB at ${env.MONGO_URI}. Start it first: run "npm run dev:db" in another terminal (project root), ` +
        'or point MONGO_URI in server/.env to your own MongoDB/Atlas.',
    );
    process.exit(1);
  }
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
