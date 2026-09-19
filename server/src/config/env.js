import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load server/.env however the process was started (npm scripts, nodemon, IDE runner...).
// Variables already set in the environment always win.
const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
if (process.env.NODE_ENV !== 'test' && existsSync(envFile)) process.loadEnvFile(envFile);

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const devSecret = (name) => (isProd ? undefined : `dev-only-${name}-change-me-0123456789abcdef`);

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  // Overrides the database named in MONGO_URI (which defaults to `test` when the URI has none).
  MONGO_DB_NAME: optional,
  // Local defaults only outside production; deployments must set real URLs.
  CLIENT_URL: isProd ? z.string().min(1, 'CLIENT_URL is required') : z.string().min(1).default('http://localhost:5173'),
  SERVER_URL: isProd ? z.string().url('SERVER_URL must be a URL') : z.string().url().default('http://localhost:5000'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_DOMAIN: optional,

  RAZORPAY_KEY_ID: optional,
  RAZORPAY_KEY_SECRET: optional,
  RAZORPAY_WEBHOOK_SECRET: optional,

  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
  CLOUDINARY_FOLDER: z.string().default('premium-ecommerce'),

  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  EMAIL_FROM: z.string().default('BlueMart Store <no-reply@example.com>'),

  REDIS_URL: optional,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default(isTest ? 'silent' : 'info'),
  // Express "trust proxy" hop count: 1 = Render only, 2 = Vercel rewrite → Render.
  // Integers only (never `true`, which lets clients spoof their IP); empty keeps the default.
  TRUST_PROXY: z.preprocess(
    (v) => (typeof v === 'string' && !v.trim() ? undefined : v),
    z.coerce.number().int().min(0).max(3).default(1),
  ),
});

const parsed = schema.safeParse({
  ...process.env,
  MONGO_URI: process.env.MONGO_URI || (isTest ? 'mongodb://127.0.0.1:27017/test' : undefined),
  JWT_SECRET: process.env.JWT_SECRET || devSecret('access'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || devSecret('refresh'),
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

const raw = parsed.data;
const clientUrls = raw.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, '')).filter(Boolean);

export const env = Object.freeze({
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  isDev: raw.NODE_ENV === 'development',
  clientUrls,
  clientUrl: clientUrls[0],
  razorpayEnabled: Boolean(raw.RAZORPAY_KEY_ID && raw.RAZORPAY_KEY_SECRET),
  cloudinaryEnabled: Boolean(raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET),
  smtpEnabled: Boolean(raw.SMTP_HOST && raw.SMTP_USER && raw.SMTP_PASSWORD),
});
