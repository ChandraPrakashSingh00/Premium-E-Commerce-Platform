# Database (MongoDB / Mongoose)

All models live in `server/src/models`, use `timestamps`, schema validation and JSON transforms that remove internal/secret fields. Money is stored in rupees (2-decimal rounding in services); only Razorpay payloads use paise.

## Collections

| Model | Purpose | Key fields | Indexes / constraints |
| --- | --- | --- | --- |
| **User** | Customers & admins | name, email, phone, password (bcrypt, `select:false`), role `USER/ADMIN`, status `active/blocked`, isEmailVerified, hashed verification/reset tokens, tokenVersion, preferences, lastLoginAt | `email` unique; role; status; createdAt; text(name, email) |
| **Session** | Refresh-token sessions | user, tokenHash (sha256), family, expiresAt, revokedAt, replacedBy, userAgent, ip | tokenHash unique; user; family; TTL on expiresAt |
| **Category** | Category tree | name, slug, description, image, parent, isPublished, sortOrder, productCount, seo | slug unique; (name, parent) unique; parent; (isPublished, sortOrder) |
| **Brand** | Brands | name, slug, logo, website, isPublished, isFeatured, productCount, seo | name unique; slug unique; isPublished |
| **Product** | Catalogue item | name, slug, descriptions, images, thumbnail, category, subcategory, brand, sku, price/compareAtPrice/discount (denormalised from variants), taxRate, attributes, options.sizes/colors, tags, stock, soldCount, ratingAverage, reviewCount, ratingBreakdown, flags, isPublished, seo | slug unique; sku unique; compound `(isPublished, category/subcategory/brand, price)`, `(isPublished, createdAt/soldCount/ratingAverage/discount/flags)`; options.sizes; options.colors.name; stock; weighted text index (name, sku, tags, shortDescription) |
| **ProductVariant** | Purchasable SKU | product, sku, title, price, compareAtPrice, size, color, colorHex, images, attributes, stock (mirror), isDefault, isActive, position | sku unique; (product, size, color) unique; (product, isActive, position) |
| **Inventory** | Stock per variant | variant, product, sku, available, reserved, sold, lowStockThreshold | variant unique; product; sku; available |
| **InventoryTransaction** | Stock ledger | inventory, product, variant, sku, type, quantity, *After snapshots, order, reason, performedBy | (inventory, createdAt); (product, createdAt); (type, createdAt); **unique partial (order, variant, type)** |
| **Cart** (+ **CartItem** subdocument) | Server cart | user, items[{product, variant, quantity}], couponCode | user unique; max 50 lines; qty 1–10 |
| **Wishlist** | Saved items | user, items[{product, variant, addedAt}] | user unique; items.product |
| **Address** | Address book | user, fullName, phone, addressLine1/2, landmark, city, state, postalCode, country, label, isDefault | (user, isDefault, updatedAt) |
| **Order** (+ **OrderItem** subdocument) | Orders | orderNumber, user, idempotencyKey, item snapshots, contact, shippingAddress snapshot, pricing, coupon, paymentMethod, paymentStatus, payment, status, statusHistory, inventoryState, reservationExpiresAt, tracking, cancellation, returnRequest, refund, notes, notificationsSent | orderNumber unique; (user, createdAt); (status, createdAt); (paymentStatus, createdAt); createdAt; items.product; contact.email; **unique partial (user, idempotencyKey)**; partial reservationExpiresAt (reserved only) |
| **Payment** | Payment per order / attempt set | order, user, method, status, amount, razorpayOrderId, razorpayPaymentId, attempts[], refunds[], amountRefunded, capturedAt | order; user; razorpayOrderId unique sparse; razorpayPaymentId; (status, createdAt) |
| **WebhookEvent** | Webhook dedupe | provider, eventId, event, status | (provider, eventId) unique; TTL 30 days |
| **Coupon** | Discount codes | code, discountType, discountValue, minOrderAmount, maxDiscount, startsAt, expiresAt, usageLimit, usedCount, perUserLimit, isActive | code unique; (isActive, expiresAt) |
| **CouponUsage** | Redemptions | coupon, user, order, slot, discountAmount | order unique; **(coupon, user, slot) unique** (race-safe per-user limit); (coupon, createdAt) |
| **Review** | Product reviews | product, user, order, rating, title, comment, images, isVerifiedPurchase, helpfulCount, helpfulBy, status, adminReply | **(product, user) unique**; (product, status, createdAt); (product, status, helpfulCount); (user, createdAt); (status, createdAt) |
| **Notification** | In-app notifications | user, type, title, message, link, isRead, email delivery status | (user, isRead, createdAt); TTL 180 days |
| **Counter** | Sequences | _id (`order-2026`), seq | – |
| **Setting** | Store settings (singleton) | shipping, COD, return window, reservation TTL, moderation, social, announcement | key unique |
| **NewsletterSubscriber**, **ContactMessage** | Marketing / support | email / name, subject, message, status | email unique; (status, createdAt) |

## Relationships

```
User 1─* Address        User 1─1 Cart        User 1─1 Wishlist      User 1─* Session
User 1─* Order 1─1 Payment                   Order *─1 Coupon (via CouponUsage)
Category 1─* Category (parent)               Category 1─* Product *─1 Brand
Product 1─* ProductVariant 1─1 Inventory 1─* InventoryTransaction
Product 1─* Review *─1 User                  Review *─1 Order (verified purchase)
```

## Query practices

- Listing endpoints project only card fields, use `.lean()`, and batch related lookups (`$in`) or aggregation `$lookup` – no N+1.
- Every list is paginated (`limit` ≤ 100) and runs `find` + `countDocuments` in parallel.
- Facets (`/products/filters`) use one `$facet` aggregation.
- Analytics bucket dates in IST (`$dateTrunc`) and fill empty buckets in code.
- Search: escaped, case-insensitive prefix regexes on name/SKU/tags plus brand/category id matches; a weighted text index is available for relevance.
- `autoIndex` is disabled in production; sync indexes during deployment (see `deployment.md`).
- Transactions (`utils/transaction.js`) are used for checkout, payment confirmation, cancellation, returns and product create/update when MongoDB is a replica set. Correctness never depends on them alone: conditional updates and unique indexes guard every critical write.
