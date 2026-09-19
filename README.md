# BlueMart — Premium E-commerce Platform

A full-stack e-commerce platform: a premium React storefront, a complete admin panel and a secure Node.js/MongoDB API with Razorpay payments, inventory reservations, coupons, reviews and email notifications.

> *Everything You Love. Delivered Better.*

---

## Features

**Storefront**
- Premium, responsive homepage: announcement bar, hero, categories, trending, new arrivals, best sellers, promo banner, why-choose-us, testimonials, newsletter
- Shop, category and search pages with URL-driven filters (category, brand, price, rating, discount, availability, size, colour), sorting, pagination, skeleton/empty/error states and a mobile filter drawer
- Search overlay with debounced suggestions, recent searches and keyboard navigation (`/` or `Ctrl/⌘ K`)
- Product page: zoomable gallery + lightbox, variant (size/colour) selection, stock status, SKU, add to bag, buy now, wishlist, specifications, shipping/returns, reviews, related products, frequently bought together, sticky mobile purchase bar, Product + Breadcrumb JSON-LD
- Guest cart and wishlist (priced by the server) that merge into the account on sign-in
- Cart drawer and cart page with coupons, free-shipping progress and server-calculated totals
- Multi-step checkout (contact → address → review → payment) with Razorpay and Cash on Delivery
- Customer account: overview, profile, password, address book, orders with tracking timeline, cancellation, returns, retry payment, wishlist, reviews, notification centre, preferences, sign out everywhere
- Auth: register, login, logout, forgot/reset password, email verification

**Admin**
- Dashboard (revenue, orders, customers, products, low stock, pending orders, charts, top products and categories, recent orders) and analytics with CSV export, all from live data
- Products with variant generator, image uploads (Cloudinary), SEO fields, publish/feature flags
- Categories (tree), brands, inventory (adjustments + audit history), orders (status workflow, tracking, cancel, refund, returns, COD collection), customers (spend, orders, block/unblock), review moderation, coupons (usage + validity), payments, store settings and contact messages

**Platform**
- JWT access tokens + rotating refresh tokens in HTTP-only cookies, reuse detection, role-based authorization
- Server-side pricing (GST, coupons, shipping, COD fee); the client never sets prices
- Atomic stock reservation → sale → release/return with an idempotent ledger (no overselling)
- Idempotent checkout (`X-Idempotency-Key`), verified and de-duplicated Razorpay webhooks, refunds
- Email notifications (welcome, verification, reset, order confirmation, payment, shipped, delivered, cancellation, refund, returns) plus in-app notifications
- Helmet, strict CORS, CSRF origin check, per-route rate limits, zod validation, NoSQL-injection and XSS sanitisation, request size limits, structured logging with redaction
- SEO: per-page meta, canonical, Open Graph/Twitter, JSON-LD, `robots.txt`, dynamic `sitemap.xml`
- Accessibility: semantic landmarks, skip link, labelled controls, focus traps, keyboard menus, reduced-motion support

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 8, TanStack Query 5, Zustand 5, React Hook Form + Zod, Framer Motion, Lucide, Recharts (admin) |
| Backend | Node.js (≥ 20.19), Express 5, Mongoose 9, Zod 4, JSON Web Tokens, bcryptjs, Helmet, CORS, express-rate-limit, Multer, Pino |
| Database | MongoDB (Atlas / replica set for transactions) |
| Integrations | Razorpay, Cloudinary, Nodemailer (SMTP) |
| Testing | Vitest, Supertest, mongodb-memory-server, Testing Library, jsdom |

## Project structure

```
premium-ecommerce/
├── client/                 React SPA
│   └── src/ assets · components (ui, layout, product, cart, common) · layouts · pages · features/* ·
│            hooks · services · store · routes · utils · constants · validators · config
├── server/                 Express API
│   ├── src/ config · controllers · models · routes · services · middleware · validators ·
│   │        integrations · jobs · utils · constants · templates · app.js · server.js
│   ├── scripts/            seed (seed.js, seed-runner.js, seed-data/)
│   └── tests/              API + service tests
├── docs/                   architecture, database, api, authentication, payment/order/inventory flows, security, deployment
├── scripts/                dev-db.js (local replica set), generate-sitemap.js
├── .env.example
├── render.yaml             Render blueprint (API)
└── package.json            npm workspaces
```

## Getting started

### Prerequisites
- Node.js 20.19+ (tested on 24) and npm 10+
- MongoDB: Atlas, a local replica set, **or** the bundled in-memory dev database (no install needed)

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example server/.env      # keep the server section
cp .env.example client/.env      # keep only the VITE_* lines
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

In development, the JWT secrets fall back to insecure dev values if they are left empty. In production the server refuses to start without them.

| Server variable | Description |
| --- | --- |
| `NODE_ENV`, `PORT` | Runtime mode and port (5000) |
| `MONGO_URI` | MongoDB connection string (a replica set enables transactions) |
| `CLIENT_URL` | Allowed storefront origin(s), comma-separated |
| `SERVER_URL` | Public API URL (sitemap/robots) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_DAYS`, `COOKIE_DOMAIN` | Auth |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payments (optional: COD works without them) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | Image uploads (optional: image URLs can be pasted) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | Email (optional: emails are logged when unset) |
| `REDIS_URL` | Reserved for a shared rate-limit store / queue |
| `LOG_LEVEL` | Pino log level |

| Client variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api/v1` |
| `VITE_SITE_URL` | Public storefront URL (canonical links) |
| `VITE_SITE_NAME` | Store name |

### 3. Database

With your own MongoDB, set `MONGO_URI`. Without one, start the bundled single-node replica set in a separate terminal (data persists in `.dev-db/`):

```bash
npm run dev:db     # mongodb://127.0.0.1:27017/premium-ecommerce?replicaSet=rs0
```

### 4. Seed data

```bash
npm run seed
```

The seed creates 51 products (202 variants), 35 categories, 11 brands, sample orders, 22 verified reviews and coupons. It refuses to run with `NODE_ENV=production` unless you pass `--force`.

| Account | Email | Password |
| --- | --- | --- |
| Admin | `admin@bluemart.store` | `Admin@12345` |
| Customer | `customer@bluemart.store` | `Customer@12345` |

Coupons: `WELCOME10`, `FLAT500`, `FESTIVE20` (`EXPIRED15` is expired, for testing).

### 5. Run

```bash
npm run dev        # API on :5000 (watch mode) + storefront on :5173
```

- Storefront: http://localhost:5173
- Admin: http://localhost:5173/admin (sign in at `/admin/login`)
- API health: http://localhost:5000/health

Frontend only: `npm run dev -w client` · Backend only: `npm run dev -w server`.

## Integrations

**Razorpay:** add test keys to `server/.env`, then create a webhook in the Razorpay dashboard pointing to `https://<public-api>/api/v1/payments/razorpay/webhook` with the same secret as `RAZORPAY_WEBHOOK_SECRET`. For local webhooks, use a tunnel (ngrok / cloudflared). Subscribe to `payment.captured`, `payment.failed`, `order.paid`, `refund.processed` and `refund.failed`. Details: [docs/payment-flow.md](docs/payment-flow.md).

**Cloudinary:** set the three `CLOUDINARY_*` credentials. Admin uploads go to `<folder>/{products,categories,brands}`, customer review photos to `<folder>/reviews`.

**Email:** set the SMTP credentials of any transactional provider. Without them, messages are rendered and logged but not delivered.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | API + client in watch mode |
| `npm run dev:db` | Local in-memory MongoDB replica set |
| `npm run seed` | Reset and seed the database |
| `npm run lint` | ESLint (server + client) |
| `npm test` | Server (Vitest + Supertest + in-memory MongoDB) and client (Vitest + Testing Library) tests |
| `npm run build` | Production build of the client (`client/dist`) |
| `npm start` | Start the API in production mode |
| `npm run sitemap` | Write `client/public/sitemap.xml` from the database |

## Testing

```bash
npm test
```

- **Server (16 files, 128 tests):** auth (registration, login, refresh rotation and reuse, password reset, email verification), authorization, users/addresses, products/filters/admin catalogue, reviews, cart, wishlist, coupons (including concurrent redemption), checkout (idempotency, concurrent last-unit purchase, with and without transactions), payments (signature verification, webhooks, expiry job), admin orders/inventory, analytics, seed, date-range, COD-quote and malformed-URL regressions.
- **Client (14 files, 99 tests):** UI and product card, guest cart store, URL filter state, login form, checkout validation, Razorpay integration, admin data table, product/coupon/settings schemas, order status control, category tree, inventory utilities, session hint.

The first server run downloads a MongoDB binary (~800 MB) for `mongodb-memory-server`.

## Production build & deployment

```bash
npm ci
npm run lint && npm test
npm run build            # client → client/dist
npm start                # API (NODE_ENV=production)
```

- **API:** Render (`render.yaml`), Railway or AWS (`server/Dockerfile`)
- **Client:** Vercel (`client/vercel.json`) or Netlify (`client/netlify.toml`), root directory `client`
- **Database:** MongoDB Atlas

Full guide: [docs/deployment.md](docs/deployment.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [API reference](docs/api.md)
- [Authentication](docs/authentication.md)
- [Payment flow](docs/payment-flow.md)
- [Order flow](docs/order-flow.md)
- [Inventory flow](docs/inventory-flow.md)
- [Security](docs/security.md)
- [Deployment](docs/deployment.md)

## Known limitations

- Razorpay, Cloudinary and SMTP must be configured with real credentials. Without them, online payments are disabled, uploads fall back to image URLs and emails are only logged. The live Razorpay flow is covered by tests with a mocked gateway, not by a real transaction.
- Rate limiting and the background job/email queue are in-process. For several API instances, move them to Redis (`REDIS_URL` is reserved).
- The storefront is a client-rendered SPA; metadata is set at runtime. Crawlers that do not execute JavaScript need prerendering/SSR for full SEO.
- No shipping-carrier or pincode-serviceability integration: tracking details are entered by admins.
- Homepage testimonials and trust statistics are editorial copy.
