import { env } from './env.js';

export const isAllowedOrigin = (origin) => !origin || env.clientUrls.includes(origin.replace(/\/$/, ''));

export const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin (curl, server-to-server, Razorpay webhooks) are allowed;
    // browsers always send Origin on cross-site requests.
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Requested-With'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,
};
