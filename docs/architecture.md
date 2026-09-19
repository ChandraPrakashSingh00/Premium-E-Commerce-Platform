# Architecture

BlueMart is a monorepo with two deployable apps that talk over a versioned JSON API.

```
premium-ecommerce/
├── client/   React 19 SPA (Vite) → static hosting (Vercel / Netlify)
├── server/   Express 5 REST API (Node.js) → Render / Railway / AWS
├── docs/     Architecture, flows, API reference, deployment
└── scripts/  Dev database (in-memory replica set), sitemap generator
```

```
Browser ──HTTPS──▶ SPA (static CDN)
   │
   └──XHR (cookies, CORS)──▶ Express API ──▶ MongoDB Atlas (replica set)
                                  │ ├──▶ Razorpay (orders, refunds)  ◀── webhooks
                                  │ ├──▶ Cloudinary (image storage)
                                  │ └──▶ SMTP (Nodemailer)
                                  └── in-process jobs (reservation expiry, email queue)
```

## Backend (`server/src`)

Request flow: **route → middleware → controller → service → model → MongoDB**.

| Layer | Responsibility |
| --- | --- |
| `routes/` | URL + HTTP verb, attaches middleware (`authenticate`, `requireAdmin`, `validate`, rate limiters). No logic. |
| `middleware/` | Auth (JWT from cookie/Bearer), role checks, zod validation, sanitisation (operator-injection + HTML), CSRF origin check, request ids, rate limits, uploads, centralised errors. |
| `controllers/` | Thin: read the validated request, call one service, send the envelope via `utils/apiResponse`. |
| `services/` | All business rules: pricing, inventory, checkout, order lifecycle, refunds, coupons, analytics, notifications. Services are the only layer that touches models. |
| `models/` | Mongoose schemas with validation, indexes, unique constraints, JSON transforms that strip secrets. |
| `integrations/` | Razorpay, Cloudinary, Nodemailer adapters. Nothing else imports the SDKs. |
| `jobs/` | In-process scheduler (reservation expiry) and a retrying background queue for emails. |
| `templates/email/` | Table-based HTML email templates with escaped data. |
| `validators/` | zod schemas per module (body / query / params). |
| `utils/` | `AppError`, `asyncHandler`, response helpers, pagination, money helpers, token helpers, `withTransaction`. |

Key decisions

- **Server-side money.** `services/pricing.service.js` is the single source of truth for subtotal, coupon allocation, GST, shipping, COD fee and total. The client never sends prices; the cart and orders store only ids and quantities until an order snapshot is taken.
- **Variants are the purchasable unit.** Every product has ≥1 `ProductVariant`; stock lives in `Inventory` (one per variant). Product-level `price`, `stock` and `options` are denormalised for fast listing/filtering.
- **Atomic, idempotent inventory.** Conditional `$inc` updates prevent overselling; an `InventoryTransaction` unique index on `(order, variant, type)` makes every order-linked movement idempotent. Multi-document transactions are used whenever MongoDB runs as a replica set (Atlas always does).
- **Idempotent checkout & payments.** Orders are keyed by `(user, X-Idempotency-Key)`; Razorpay webhooks are de-duplicated by event id; payment confirmation is a conditional update that can only succeed once.
- **Stateless API.** Access tokens are short-lived JWTs; refresh tokens rotate and are stored hashed. Any instance can serve any request (horizontal scaling). The in-process job runner should run on one instance (or be moved to a Redis-backed queue – see *Scaling*).

## Frontend (`client/src`)

| Folder | Purpose |
| --- | --- |
| `components/ui` | Design-system primitives: Button, Input, Select, Modal, Drawer, Dropdown, Toaster, Badge, Card, Rating, Pagination, Skeleton, EmptyState, ErrorState, ConfirmationModal, SmartImage… |
| `components/layout`, `components/product`, `components/common` | Navbar, footer, overlays, product card/grid/gallery/filters, SEO. |
| `layouts/` | `PublicLayout`, `AuthLayout`, `AccountLayout`, `AdminLayout`. |
| `pages/` | Route components (lazy-loaded per route). |
| `features/<domain>` | API calls + TanStack Query hooks + domain components (auth, products, categories, cart, wishlist, checkout, orders, reviews, account, notifications, admin). |
| `store/` | Zustand: session user, guest cart, guest wishlist, toasts, overlays, recent searches. |
| `services/` | Axios client (cookie auth, single-flight refresh, error normalisation) and the Query client + key factory. |
| `routes/` | Router definition and guards (`RequireAuth`, `RequireAdmin`, `GuestOnly`). |

State strategy: **server state** in TanStack Query (cache, retries, invalidation), **client state** in Zustand (guest cart/wishlist persisted to localStorage, UI overlays). Guest carts are priced by `POST /cart/preview` and merged into the server cart on sign-in.

## Scaling notes

- Add indexes before adding hardware – all list/filter paths are index-backed (see `database.md`).
- Run ≥2 API instances behind the platform load balancer; keep `trust proxy` enabled for correct client IPs.
- For multiple instances, move rate limiting and the background queue to Redis (`REDIS_URL` is reserved): `rate-limit-redis` store + BullMQ worker. Until then, run the reservation-expiry job on a single instance (it is safe to run on several – each cancellation is a conditional update – but it wastes work).
- Serve images through Cloudinary (`f_auto,q_auto,w_…` transformations are applied client-side).
