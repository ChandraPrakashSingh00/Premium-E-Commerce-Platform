# API Reference (`/api/v1`)

All endpoints are prefixed with `/api/v1`. Authentication uses HTTP-only cookies
(`accessToken`, `refreshToken`) set by the auth endpoints; `Authorization: Bearer <accessToken>`
is also accepted for non-browser clients.

## Conventions

**Success envelope**

```json
{ "success": true, "message": "Request successful", "data": {} }
```

**Error envelope**

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "body.email", "message": "Enter a valid email address" }], "code": "VALIDATION_ERROR" }
```

| Status | Meaning |
| --- | --- |
| 400 | Malformed request / business rule violated (`BAD_REQUEST`) |
| 401 | Not authenticated / token expired (`UNAUTHORIZED`) |
| 403 | Authenticated but not allowed, blocked account, bad origin (`FORBIDDEN`) |
| 404 | Not found (`NOT_FOUND`) |
| 409 | Conflict – duplicate, stock changed, invalid state transition (`CONFLICT`) |
| 422 | Input validation failed (`VALIDATION_ERROR`) |
| 429 | Rate limited (`RATE_LIMITED`) |
| 500 | Unexpected error (details hidden in production) |
| 502/503 | Payment gateway / uploads / email provider unavailable |

**Paginated lists** return `data = { items: [], pagination: { page, limit, total, totalPages, hasNextPage, hasPrevPage }, meta? }`.
Query params: `page` (default 1), `limit` (default 12, max 100).

Money values are **rupees** (numbers with up to 2 decimals). Only Razorpay payloads use paise.
All prices returned by the API are calculated by the server; the client never sends prices.

---

## Shared shapes

**User**
```ts
{ _id, name, email, phone?, role: 'USER'|'ADMIN', status: 'active'|'blocked', avatar?, isEmailVerified,
  preferences: { newsletter, orderUpdates, promotions }, lastLoginAt?, createdAt, updatedAt }
```

**ProductCard** (used in every list)
```ts
{ _id, name, slug, thumbnail, images: [{url, alt}] /* max 2 */, shortDescription,
  brand: { _id, name, slug }, category: { _id, name, slug },
  price, compareAtPrice, discount, ratingAverage, reviewCount, stock, inStock,
  isFeatured, isBestSeller, isNewArrival,
  defaultVariantId, variantCount, options: { sizes: string[], colors: [{name, hex}] } }
```

**ProductDetail** = ProductCard fields plus
```ts
{ description, images: [{url, alt, publicId?}], sku, taxRate, attributes: [{name, value}], tags,
  subcategory?: {_id, name, slug}, ratingBreakdown: {1..5: count},
  shippingInfo, returnPolicy, seo: {title, description, keywords, canonicalUrl},
  variants: [{ _id, sku, title, price, compareAtPrice, size?, color?, colorHex?, images, stock, inStock, isDefault }],
  breadcrumbs: [{ name, slug }], publishedAt, createdAt }
```

**CartView** (returned by every cart endpoint and by `/cart/preview`)
```ts
{
  items: [{
    _id,                 // cart line id (for guest preview: the variantId)
    productId, variantId, name, slug, image, brandName, sku, size?, color?,
    price, compareAtPrice, quantity, maxQuantity, stock, inStock,
    lineSubtotal,
    issue: null | 'unavailable' | 'out_of_stock' | 'insufficient_stock' | 'price_changed'
  }],
  summary: { itemCount, subtotal, discount, couponDiscount, tax, shipping, codFee, total,
             freeShippingThreshold, amountToFreeShipping },
  coupon: null | { code, description, discountType, discountValue, discountAmount },
  couponError: null | string,
  hasIssues: boolean
}
```
`discount` = savings vs. compareAtPrice (informational, already reflected in `price`).
`total = subtotal - couponDiscount + tax + shipping + codFee`.

**Address**
```ts
{ _id, fullName, phone, addressLine1, addressLine2, landmark, city, state, postalCode, country, label: 'home'|'work'|'other', isDefault }
```

**Order**
```ts
{ _id, orderNumber /* ORD-2026-000001 */, user, items: [{ _id, product, variant, name, slug, image, sku, size, color, brandName,
    price, compareAtPrice, quantity, taxRate, lineSubtotal, discountAmount, taxAmount, lineTotal, isReviewed }],
  contact: { name, email, phone }, shippingAddress: Address-fields,
  pricing: { subtotal, discount, couponDiscount, tax, shipping, codFee, total, currency },
  coupon?: { code }, paymentMethod: 'razorpay'|'cod',
  paymentStatus: 'pending'|'paid'|'failed'|'refunded'|'partially_refunded',
  status: 'pending'|'confirmed'|'processing'|'packed'|'shipped'|'out_for_delivery'|'delivered'|'cancelled'|'returned'|'refunded',
  statusHistory: [{ status, note, at }], tracking: { carrier, trackingNumber, trackingUrl, estimatedDelivery, shippedAt, deliveredAt },
  cancellation?: { reason, cancelledBy, cancelledAt }, returnRequest?: { status, reason, comment, adminNote, requestedAt, resolvedAt },
  refund: { status: 'none'|'pending'|'processed'|'failed', amount, processedAt },
  reservationExpiresAt?, paidAt?, customerNote?, createdAt, updatedAt,
  // computed for the customer:
  canCancel: boolean, canReturn: boolean, canRetryPayment: boolean }
```

**RazorpayCheckout** (returned when an online payment must be completed)
```ts
{ provider: 'razorpay', keyId, razorpayOrderId, amount /* paise */, currency: 'INR', orderId, orderNumber,
  prefill: { name, email, contact } }
```

---

## Auth – `/auth`

| Method | Path | Auth | Body | Result |
| --- | --- | --- | --- | --- |
| POST | `/register` | – | `{ name, email, password, phone? }` | 201 `{ user }`, sets cookies, sends verification + welcome email |
| POST | `/login` | – | `{ email, password }` | `{ user }`, sets cookies |
| POST | `/admin/login` | – | `{ email, password }` | `{ user }` – 403 unless role is ADMIN |
| POST | `/refresh` | refresh cookie | – | `{ user }`, rotates both cookies. Re-use of an old refresh token revokes the session family |
| POST | `/logout` | – | – | clears cookies, revokes current session |
| POST | `/logout-all` | user | – | revokes all sessions + access tokens |
| GET | `/me` | user | – | `{ user }` |
| POST | `/forgot-password` | – | `{ email }` | always 200 (no user enumeration) |
| POST | `/reset-password/:token` | – | `{ password }` | 200, revokes all sessions |
| POST | `/verify-email` | – | `{ token }` | `{ user }` |
| POST | `/resend-verification` | user | – | 200 |
| PATCH | `/change-password` | user | `{ currentPassword, newPassword }` | `{ user }`, revokes other sessions, re-issues cookies |

Password rules: 8–128 chars with upper, lower and a digit.

Notes: invalid/expired reset or verification tokens → 400. `resend-verification` → 400 when the email is already verified.
`change-password` with a wrong `currentPassword` → 400 (not 401, so clients don't try to refresh); it revokes **all**
sessions/access tokens and issues a fresh session for the caller. Blocked accounts get 403 on login/refresh.

## Users – `/users` (authenticated)

| Method | Path | Body / Query | Result |
| --- | --- | --- | --- |
| PATCH | `/me` | `{ name?, phone?, avatar? }` | `{ user }` |
| PATCH | `/me/preferences` | `{ newsletter?, orderUpdates?, promotions? }` | `{ user }` |
| GET | `/me/stats` | – | `{ orderCount, totalSpent, wishlistCount, reviewCount, activeOrders }` |
| GET | `/me/addresses` | – | `Address[]` (default first) |
| POST | `/me/addresses` | Address fields (`isDefault?`) | 201 `Address` (first address becomes default); max 10 |
| PATCH | `/me/addresses/:id` | partial Address | `Address` |
| DELETE | `/me/addresses/:id` | – | 200 (promotes another default) |
| PATCH | `/me/addresses/:id/default` | – | `Address[]` |
| GET | `/me/reviews` | `page, limit` | paginated `Review` with `product: {_id, name, slug, thumbnail}` |

## Catalogue

### Products – `/products`

| Method | Path | Query | Result |
| --- | --- | --- | --- |
| GET | `/` | `page, limit, q, ids (comma-separated product ids, max 100; invalid ⇒ 422), category (slug – includes children), brand (comma slugs), minPrice, maxPrice, rating (min 1-5), discount (min %), inStock (bool), size (comma), color (comma), sort, featured, bestSeller, newArrival` | paginated `ProductCard` |
| GET | `/filters` | `category, q` | `{ categories: [{_id,name,slug,count}], brands: [{_id,name,slug,count}], priceRange: {min,max}, sizes: [{value,count}], colors: [{name,hex,count}] }` |
| GET | `/suggestions` | `q` (min 2 chars) | `{ products: [{_id,name,slug,thumbnail,price,brandName}], categories: [{name,slug}], brands: [{name,slug}] }` |
| GET | `/home` | – | `{ featured, trending, newArrivals, bestSellers }` (arrays of `ProductCard`, 8 each) |
| GET | `/:slug` | – | `ProductDetail` (404 if unpublished) |
| GET | `/:slug/related` | `limit` | `ProductCard[]` |
| GET | `/:slug/frequently-bought` | `limit` | `ProductCard[]` (co-purchase data, falls back to same category) |

`sort`: `featured` (default) · `newest` · `price-low` · `price-high` · `rating` · `best-selling` · `discount`.
Search `q` matches name, tags, SKU (text index + prefix regex fallback) and also products whose brand or category name matches.

### Categories – `/categories`

| GET | `/` | – | published tree `[{ _id, name, slug, description, image, productCount, children: [...] }]` |
| GET | `/:slug` | – | `{ category, children, breadcrumbs: [{name, slug}] }` |

### Brands – `/brands`

| GET | `/` | – | `[{ _id, name, slug, logo, description, productCount, isFeatured }]` |
| GET | `/:slug` | – | brand |

### Reviews – `/reviews`

| Method | Path | Auth | Body / Query | Result |
| --- | --- | --- | --- | --- |
| GET | `/product/:productId` | optional | `page, limit, sort (recent\|helpful\|rating-high\|rating-low), rating` | paginated approved reviews `{ _id, rating, title, comment, images, isVerifiedPurchase, helpfulCount, isHelpful, adminReply, user: {name, avatar}, createdAt }`, `meta.summary = { average, count, breakdown }` |
| GET | `/eligibility/:productId` | user | – | `{ canReview, reason?, existingReview? }` – only customers with a **delivered** order containing the product may review |
| POST | `/` | user | `{ productId, rating, title, comment, images?: [{url, publicId}] }` | 201 review (`pending` if moderation is enabled) |
| PATCH | `/:id` | owner | partial | review (goes back to `pending` when moderated) |
| DELETE | `/:id` | owner | – | 200 |
| POST | `/:id/helpful` | user | – | `{ helpfulCount, isHelpful }` (toggle) |
| POST | `/images` | user | multipart `images[]` (max 5) | 201 `[{ url, publicId }]` |

Notes: creating a review without a delivered order containing the product → 403; a second review → 409.
`eligibility.reason` is `already_reviewed` or `not_purchased`. Voting on your own review → 400. Deleting a review
re-opens eligibility (the order item's `isReviewed` is reset). Ratings count **approved** reviews only.

## Cart – `/cart`

| Method | Path | Auth | Body | Result |
| --- | --- | --- | --- | --- |
| GET | `/` | user | – | `CartView` |
| POST | `/items` | user | `{ variantId, quantity }` | `CartView` (quantities merge, capped by stock and 10) |
| PATCH | `/items/:itemId` | user | `{ quantity }` | `CartView` |
| DELETE | `/items/:itemId` | user | – | `CartView` |
| DELETE | `/` | user | – | empty `CartView` |
| POST | `/merge` | user | `{ items: [{ variantId, quantity }] }` | `CartView` – merges guest cart after login |
| POST | `/coupon` | user | `{ code }` | `CartView` (422 with message if invalid) |
| DELETE | `/coupon` | user | – | `CartView` |
| POST | `/preview` | optional | `{ items: [{ variantId, quantity }], couponCode? }` | `CartView` for guest carts (item `_id` = variantId) |

## Wishlist – `/wishlist` (authenticated)

| GET | `/` | – | `{ items: [{ product: ProductCard, variantId, addedAt }] }` |
| GET | `/ids` | – | `string[]` product ids |
| POST | `/items` | `{ productId, variantId? }` | wishlist |
| DELETE | `/items/:productId` | – | wishlist |
| POST | `/items/:productId/move-to-cart` | `{ variantId? }` | `{ wishlist, cart: CartView }` |
| POST | `/merge` | `{ productIds: [] }` | wishlist |

## Coupons – `/coupons`

| GET | `/available` | – | active public coupons `[{ code, description, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt }]` |

## Orders – `/orders` (authenticated)

| Method | Path | Body / Query | Result |
| --- | --- | --- | --- |
| POST | `/quote` | `{ paymentMethod }` | `CartView` + `{ codAvailable, codUnavailableReason? }` (codFee applied for COD) |
| POST | `/` | header `X-Idempotency-Key: <uuid>` (required); `{ addressId, contact: {name, email, phone}, paymentMethod: 'razorpay'\|'cod', customerNote? }` | 201 `{ order, payment: RazorpayCheckout \| null }`. Same key ⇒ same order (200) |
| GET | `/` | `page, limit, status` | paginated Order summaries `{ _id, orderNumber, status, paymentStatus, paymentMethod, pricing, itemCount, items (first 3: name,image,quantity), createdAt }` |
| GET | `/:id` | – | `Order` |
| POST | `/:id/cancel` | `{ reason }` | `Order` (refund initiated automatically if paid) |
| POST | `/:id/return` | `{ reason, comment? }` | `Order` (delivered orders within the return window) |
| POST | `/:id/pay` | – | `{ order, payment: RazorpayCheckout }` – retry payment for a pending online order |

Checkout rules: cart must be non-empty with no issues (409 otherwise), address must belong to the user,
COD must be enabled and within `codMaxOrderAmount`. Stock is **reserved** at order creation;
unpaid online orders are auto-cancelled after `reservationTtlMinutes` (default 30) and stock released.
COD orders are confirmed immediately and stock is committed.

Error details:
- Missing/invalid `X-Idempotency-Key` (must be 8–100 chars of `A-Z a-z 0-9 - _ : .`) → 422.
- Empty cart or cart items with issues → 409 (`errors[]` lists the affected `variantId`s); coupon no longer valid → 422 with the coupon message; address not owned → 404; COD disabled / above `codMaxOrderAmount`, or online payments not configured → 400.
- Gateway failure while creating the Razorpay order → 502; the new order is cancelled by the system (stock and coupon released).
- `POST /:id/cancel` needs `reason` (3–500 chars); 409 when the status is not `pending|confirmed|processing` or the order is already cancelled.
- `POST /:id/return` → 409 when not delivered, a request already exists, or `returnWindowDays` since `tracking.deliveredAt` has passed.
- `POST /:id/pay` → 409 unless the order is a pending, unpaid Razorpay order whose reservation has not expired. The existing Razorpay order id is reused when possible.

Cart details: `POST /cart/items` → 404 if the variant/product is unavailable, 409 if out of stock. Quantities are clamped to `min(10, available)`.
A coupon that became invalid is removed from the cart on the next read, and that response carries `couponError` once.
`POST /wishlist/items/:productId/move-to-cart` uses the given `variantId`, then the wishlisted variant, then the default or first in-stock active variant. It returns 409 when that choice is out of stock.

## Payments – `/payments`

| Method | Path | Auth | Body | Result |
| --- | --- | --- | --- | --- |
| GET | `/config` | – | – | `{ razorpayEnabled, keyId, codEnabled }` |
| POST | `/razorpay/verify` | user | `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` | `{ order }` – HMAC verified server-side; idempotent |
| POST | `/razorpay/failure` | user | `{ orderId, razorpayOrderId, cancelled?, error?: {code, description, reason, paymentId} }` | `{ order }` – records failed/cancelled attempt; order stays pending for retry |
| POST | `/razorpay/webhook` | Razorpay signature | raw JSON | 200 – handles `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, `refund.failed`; deduplicated by `x-razorpay-event-id` |

Payment details:
- `verify` returns 400 `Payment verification failed` on a bad signature, and also when the gateway reports a different order, an amount mismatch or a non-captured status. Each of these is recorded as an attempt. If the gateway can't be reached, a valid signature is enough.
- `failure` never changes a paid order. A non-cancelled failure sets `paymentStatus: failed`, but the order stays `pending` and can be paid again until the reservation expires.
- The webhook returns 400 on a bad signature and 5xx on internal errors; the event claim is dropped so Razorpay's retry is processed. Unknown events → 200 `ignored`. Events without an id are deduplicated by the SHA-256 of the body.
- Late payment (captured after the order was auto-cancelled on expiry): the order is reinstated (`confirmed`) if stock is still available. Otherwise it stays cancelled and the full amount is refunded automatically.
- Refunds: cancelling or completing a return on a paid order refunds it automatically. A full refund moves `cancelled`/`returned` orders to `refunded`. COD refunds are recorded as `processed` because they are settled offline.

## Notifications – `/notifications` (authenticated)

| GET | `/` | `page, limit, unreadOnly` | paginated + `meta.unreadCount` |
| PATCH | `/:id/read` | – | notification |
| PATCH | `/read-all` | – | `{ updated }` |
| DELETE | `/:id` | – | 200 |

## Store – `/store`

| GET | `/settings` | – | public settings `{ storeName, supportEmail, supportPhone, address, currency, announcement, freeShippingThreshold, shippingFee, codEnabled, codFee, codMaxOrderAmount, returnWindowDays, social, razorpayEnabled }` |
| POST | `/newsletter` | – | `{ email, source? }` → 200 (idempotent) |
| POST | `/contact` | – | `{ name, email, subject, message }` → 201 `{ _id }` |

## Admin – `/admin` (role ADMIN required)

### Dashboard & analytics
| GET | `/dashboard` | `range=7d\|30d\|90d\|12m` | `{ cards: { revenue, orders, customers, products, lowStock, pendingOrders } /* each {value, change} (change = % vs previous period, null when n/a) */, revenueSeries: [{date, revenue, orders}], customerSeries: [{date, customers}], orderStatusBreakdown: [{status, count}], topProducts: [{productId, name, thumbnail, quantity, revenue}], topCategories: [{categoryId, name, quantity, revenue}], recentOrders: [Order summary + customer {name,email}] }` |
| GET | `/analytics` | `from, to (ISO dates), granularity=day\|week\|month` | `{ summary: {revenue, orders, avgOrderValue, newCustomers, refunded, itemsSold}, series: [{date, revenue, orders, customers}], paymentMethods: [{method, count, revenue}], topProducts, topCategories, topBrands: [{brandId, name, quantity, revenue}] }` |

Revenue counts orders whose status is not `cancelled`/`refunded` and that are `paid` / `partially_refunded`
(net of `refund.amount`), or delivered COD orders still `pending` payment. Dates are bucketed in IST (`Asia/Kolkata`);
series `date` is the first day of the bucket (`YYYY-MM-DD`, weeks start Monday) and empty buckets are zero-filled.

Dashboard details: `range` defaults to `30d`. The current window starts at the beginning of the first IST day/month of the
range and ends now; the previous window has the same length. `orders` = all orders placed in the window.
`customers.value` = new customers (role USER) in the window, plus `customers.total` (all customers).
Cards also carry `previous` (revenue/orders/customers) and `products.published`. `data.period = { from, to, previousFrom, granularity }`.
`lowStock` = inventory rows with `available <= lowStockThreshold`; `pendingOrders` = status `pending` or `confirmed`.
`topProducts`/`topCategories` (5 each) and item revenue use `items.lineTotal` of revenue orders. `recentOrders` (8) =
`{ _id, orderNumber, status, paymentStatus, paymentMethod, pricing, itemCount, createdAt, customer: {_id, name, email} }`.

Analytics details: `from` defaults to 30 days before `to` (default today); `to` includes the whole IST day. `from > to` → 422;
more than 366 daily / 260 weekly / 120 monthly buckets → 400. `summary.orders` = all orders placed;
`avgOrderValue` = revenue / revenue orders; `refunded` = processed refund amounts; `itemsSold` counts revenue orders only.
Top lists return 10 items. `data.period = { from, to, granularity }`.

### Products
| GET | `/products` | `page, limit, q, category (id or slug), brand (id or slug), status=published\|draft, stock=in\|low\|out, sort=newest\|name\|price-low\|price-high\|stock` | paginated `{ ...ProductCard, sku, isPublished, variantCount, createdAt }` |
| GET | `/products/:id` | – | product with `variants[]` each including `inventory: {_id, available, reserved, sold, lowStockThreshold}` |
| POST | `/products` | ProductInput | 201 product |
| PATCH | `/products/:id` | partial ProductInput | product |
| DELETE | `/products/:id` | – | 200 (409 if it has open orders → unpublish instead) |
| PATCH | `/products/:id/publish` | `{ isPublished }` | product |

`ProductInput`:
```ts
{ name, slug?, shortDescription?, description?, images: [{url, publicId?, alt?}], category, subcategory?, brand,
  sku, price, compareAtPrice?, taxRate?, attributes?: [{name, value}], tags?: string[],
  isFeatured?, isBestSeller?, isNewArrival?, isPublished?, shippingInfo?, returnPolicy?, seo?,
  lowStockThreshold?, stock? /* initial stock when no variants */,
  variants?: [{ _id? /* existing */, sku, size?, color?, colorHex?, price, compareAtPrice?, images?, isActive?, isDefault?, stock? /* initial stock for NEW variants only */ }] }
```
Stock of existing variants is changed only through the inventory endpoints (audited).

### Uploads
| POST | `/uploads/images?folder=products\|categories\|brands` | multipart `images[]` (≤8, ≤5 MB, jpeg/png/webp/avif) | `[{ url, publicId }]` (503 when Cloudinary isn't configured) |
| DELETE | `/uploads/images` | `{ publicId }` | 200 |

Upload returns 201. Admin product notes: the slug is kept when the name changes (send `slug` to change it);
`price`/`compareAtPrice` without `variants` only apply to single-variant products (aggregates are always recomputed
from active variants); `variants` is the full desired list – omitted variants are deactivated when they have order
history, otherwise deleted; `stock`/`variants[].stock` are ignored for existing variants.

### Categories / Brands
| GET | `/categories` | `q` | flat list incl. unpublished `{ ..., parent: {_id, name} \| null, productCount }` |
| POST | `/categories` | `{ name, slug?, description?, image?, parent?, isPublished?, sortOrder?, seo? }` | 201 |
| PATCH | `/categories/:id` | partial | category (cannot be its own ancestor) |
| DELETE | `/categories/:id` | – | 409 if it has products or children |
| PATCH | `/categories/:id/publish` | `{ isPublished }` | category |
| GET | `/brands` | `q` | list incl. unpublished |
| POST / PATCH / DELETE | `/brands`, `/brands/:id` | `{ name, slug?, description?, logo?, website?, isPublished?, isFeatured?, seo? }` | brand (DELETE 409 if products use it) |
| PATCH | `/brands/:id/publish` | `{ isPublished }` | brand |

### Inventory
| GET | `/inventory` | `page, limit, q (sku/product), status=in\|low\|out` | paginated `{ _id, sku, available, reserved, sold, lowStockThreshold, isLowStock, product: {_id, name, slug, thumbnail}, variant: {_id, title, size, color} }`, `meta: { totalSkus, lowStock, outOfStock }` |
| PATCH | `/inventory/:id` | `{ mode: 'set'\|'increment'\|'decrement', quantity, reason, lowStockThreshold? }` | inventory (ADJUSTMENT transaction recorded) |
| GET | `/inventory/transactions` | `page, limit, type, inventoryId, productId` | paginated `{ _id, type, quantity, sku, availableAfter, reservedAfter, soldAfter, reason, order: {_id, orderNumber}, performedBy: {name}, createdAt }` |

### Orders
| GET | `/orders` | `page, limit, q (order no./email/name/phone), status, paymentStatus, paymentMethod, from, to` | paginated summaries + `customer {name, email}` |
| GET | `/orders/:id` | – | `Order` + `user {_id, name, email, phone}` + `payment` + `allowedTransitions: string[]` |
| PATCH | `/orders/:id/status` | `{ status, note?, tracking? }` | `Order` – 409 on invalid transition |
| PATCH | `/orders/:id/tracking` | `{ carrier?, trackingNumber?, trackingUrl?, estimatedDelivery? }` | `Order` |
| POST | `/orders/:id/cancel` | `{ reason }` | `Order` (releases/returns stock, refunds if paid) |
| PATCH | `/orders/:id/return` | `{ action: 'approve'\|'reject'\|'complete', note? }` | `Order` – `complete` restocks and refunds |
| POST | `/orders/:id/refund` | `{ amount?, reason? }` | `Order` – full refund by default |
| PATCH | `/orders/:id/payment-status` | `{ paymentStatus: 'paid' }` | `Order` (COD collected) |
| PATCH | `/orders/:id/note` | `{ adminNote }` | `Order` |

Admin order details: all admin order mutations return the same shape as `GET /orders/:id` (with `user`, `payment` and `allowedTransitions`).
`PATCH /status` with `cancelled` runs the full cancellation.
`returned` and `refunded` are rejected with 409; use `/return` and `/refund` instead, which is why `allowedTransitions` never lists them.
`shipped` stamps `tracking.shippedAt`, and `delivered` stamps `tracking.deliveredAt`. A delivered COD order becomes `paymentStatus: paid`.
`/refund` returns 409 when the amount is above the refundable balance.
`/payment-status` is for COD only and needs a confirmed (or later), non-cancelled order.

Inventory details: `status=low` means `0 < available <= lowStockThreshold`, and `out` means `available = 0`.
Each `quantity` on a transaction is signed: RESERVE and SALE are negative, RELEASE and RETURN are positive, and ADJUSTMENT is the change applied.
`quantity` must be at least 1 unless `mode` is `set`, and a decrement below zero returns 409.

### Customers
| GET | `/customers` | `page, limit, q (name/email/phone), status, sort=newest\|oldest\|name\|spent\|orders` | paginated `{ _id, name, email, phone, status, isEmailVerified, createdAt, lastLoginAt, orderCount, totalSpent, lastOrderAt }` |
| GET | `/customers/:id` | – | `{ customer, stats: {orderCount, totalSpent, avgOrderValue, cancelledCount}, recentOrders, addresses }` |
| PATCH | `/customers/:id/status` | `{ status: 'active'\|'blocked' }` | customer (blocking revokes sessions and access tokens; 400 for your own account, 403 for admin accounts) |

### Reviews
| GET | `/reviews` | `page, limit, status, rating, q` | paginated with `product {_id, name, slug, thumbnail}`, `user {_id, name, email}` |
| PATCH | `/reviews/:id` | `{ status?, adminReply? }` | review (product rating recalculated) |
| DELETE | `/reviews/:id` | – | 200 |

### Coupons
| GET | `/coupons` | `page, limit, q, status=active\|inactive\|expired\|scheduled` | paginated coupons (with `isExpired`, `usedCount`) |
| GET | `/coupons/:id` | – | `{ coupon, usages: [{ user: {name,email}, order: {orderNumber}, discountAmount, createdAt }] }` |
| POST | `/coupons` | `{ code, description?, discountType, discountValue, minOrderAmount?, maxDiscount?, startsAt?, expiresAt, usageLimit?, perUserLimit?, isActive? }` | 201 |
| PATCH | `/coupons/:id` | partial | coupon |
| DELETE | `/coupons/:id` | – | 200 (409 if already used → deactivate instead) |
| PATCH | `/coupons/:id/status` | `{ isActive }` | coupon |

### Payments
| GET | `/payments` | `page, limit, q (order no./razorpay id), status, method, from, to` | paginated `{ ...Payment, order: {_id, orderNumber, status}, user: {name, email} }`, `meta: { capturedAmount, refundedAmount, failedCount }` |
| GET | `/payments/:id` | – | payment with attempts & refunds |

### Settings & messages
| GET | `/settings` | – | full settings |
| PATCH | `/settings` | partial settings | settings |
| GET | `/messages` | `page, limit, status` | paginated contact messages |
| PATCH | `/messages/:id` | `{ status }` | message |

## SEO (outside `/api/v1`)

| GET | `/robots.txt` | robots file |
| GET | `/sitemap.xml` | sitemap of static pages, published categories, brands and products (URLs point at `CLIENT_URL`) |
| GET | `/health` | liveness + DB readiness |
