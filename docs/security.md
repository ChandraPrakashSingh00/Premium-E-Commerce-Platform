# Security

## Controls in place

| Area | Implementation |
| --- | --- |
| HTTP headers | `helmet` (HSTS in production, `X-Content-Type-Options`, `frame-ancestors 'none'`, strict API CSP `default-src 'none'`), `x-powered-by` disabled. Static hosting configs add the same headers for the SPA (`client/vercel.json`, `client/netlify.toml`). |
| CORS | Allow-list from `CLIENT_URL` (comma-separated). `origin: "*"` is never used; credentials enabled only for listed origins. |
| CSRF | Cookies are `HttpOnly` + `Secure`; state-changing requests with an `Origin` header outside the allow-list are rejected (`middleware/security.js`). Axios also sends `X-Requested-With`, which forces a CORS pre-flight for cross-site requests. |
| Authentication | Short-lived access JWTs, rotating hashed refresh tokens with reuse detection, token versioning for instant revocation (see `authentication.md`). |
| Passwords | bcrypt (12 rounds), strong password policy, never returned (`select: false` + JSON transform), reset tokens stored as SHA-256 hashes with expiry. |
| Authorization | `authenticate`, `authorize`, `requireAdmin`; ownership checks inside services; admins cannot block themselves or other admins. |
| Input validation | zod schemas for every body/query/param (unknown keys stripped, types coerced, lengths bounded). Mongoose schema validation as a second layer. |
| NoSQL injection | `sanitizeRequest` deletes keys starting with `$` or containing `.` (and prototype-pollution keys) from body, params and query; zod ensures filters are primitives; `strictQuery` enabled. Regex search input is escaped. |
| XSS | React escapes output; request strings are stripped of script/iframe/event-handler markup; email templates escape all interpolated data; JSON-LD is serialised with `<` escaped. |
| Rate limiting | Global API limiter + stricter limiters for auth, password reset/verification/contact/newsletter and checkout (`middleware/rateLimiters.js`). |
| Request size | JSON/urlencoded bodies limited to 1 MB; uploads limited to 8 files × 5 MB, image MIME types only, stored in memory and streamed to Cloudinary. |
| Payments | Razorpay secret and webhook secret exist only on the server. Checkout signatures and webhook signatures are verified with HMAC-SHA256 + constant-time comparison. Amounts are computed server-side; client-reported payment status is never trusted. Webhooks are de-duplicated. |
| Errors | Central error handler maps known errors to 4xx; unknown errors return a generic 500 in production (no stack traces). Every response carries `X-Request-Id` for tracing. |
| Logging | `pino` structured logs with redaction of `authorization`, cookies, passwords and tokens. |
| Secrets | Loaded from environment variables and validated at boot (`config/env.js`); the server refuses to start in production without JWT secrets. `.env*` files are git-ignored; only `.env.example` is committed. |
| Data exposure | Admin customer endpoints never return password hashes or tokens; public review endpoints expose only reviewer name/avatar. |

## Production checklist

- [ ] Generate unique 48+ byte `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- [ ] `NODE_ENV=production`, HTTPS everywhere, `CLIENT_URL` set to the exact storefront origin(s).
- [ ] MongoDB Atlas: dedicated DB user with least privileges, IP access list / private networking, backups enabled.
- [ ] Razorpay live keys + webhook secret configured; webhook URL `https://<api>/api/v1/payments/razorpay/webhook` subscribed to `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`.
- [ ] SMTP credentials for a transactional provider with SPF/DKIM/DMARC configured.
- [ ] Change the seeded admin password (or do not run the seed in production).
- [ ] Enable platform DDoS/WAF protection and log shipping/alerting.
- [ ] Run `npm audit` in CI.

## Reporting

Report vulnerabilities privately to the security contact configured in store settings; do not open public issues.
