import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { corsOptions } from './config/cors.js';
import { isDatabaseReady } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { globalErrorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { csrfOriginCheck, requestId, sanitizeRequest } from './middleware/security.js';
import apiRouter from './routes/index.js';
import { razorpayWebhook } from './controllers/payment.controller.js';
import { robotsTxt, sitemapXml } from './controllers/seo.controller.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  if (!env.isTest) {
    app.use(pinoHttp({ logger, genReqId: (req) => req.id, autoLogging: { ignore: (req) => req.url === '/health' } }));
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    }),
  );
  app.use(cors(corsOptions));
  app.use(compression());

  // Razorpay webhook needs the exact raw body for signature verification,
  // so it is registered before the JSON parser.
  app.post('/api/v1/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeRequest);

  app.get('/health', (_req, res) => {
    const db = isDatabaseReady();
    res.status(db ? 200 : 503).json({ success: db, message: db ? 'OK' : 'Database unavailable', data: { uptime: process.uptime() } });
  });
  app.get('/robots.txt', robotsTxt);
  app.get('/sitemap.xml', sitemapXml);

  app.use('/api/v1', apiLimiter, csrfOriginCheck, apiRouter);

  app.use(notFound);
  app.use(globalErrorHandler);
  return app;
}
