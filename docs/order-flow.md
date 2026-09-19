# Order Flow

## Lifecycle

```
                ┌──────────── cancelled ──(refund)──▶ refunded
                │   ▲    ▲      ▲     ▲
pending ──▶ confirmed ──▶ processing ──▶ packed ──▶ shipped ──▶ out_for_delivery ──▶ delivered ──▶ returned ──▶ refunded
   │                                                  └──────────────────────────────▶┘
   └──▶ cancelled (unpaid / expired)
```

Transitions are defined once in `server/src/constants/index.js` (`ORDER_TRANSITIONS`) and enforced by `orderLifecycle.updateStatus`; anything else returns **409**. The admin UI only offers `allowedTransitions` returned by `GET /admin/orders/:id`. `returned` and `refunded` are reached only through the return and refund endpoints (never by a plain status change), because they move stock and money.

| Status | Meaning | Who sets it |
| --- | --- | --- |
| pending | Created, waiting for online payment (stock reserved) | checkout |
| confirmed | Paid online, or COD accepted | payment confirmation / COD checkout |
| processing → packed → shipped → out_for_delivery → delivered | Fulfilment | admin (tracking required when shipping; `shippedAt` / `deliveredAt` recorded) |
| cancelled | Cancelled by customer (pending/confirmed/processing), admin (before shipping) or system (payment expiry) | customer / admin / job |
| returned | Return completed and stock restocked | admin |
| refunded | Money returned in full after cancellation or return | refund service |

Payment status is tracked separately: `pending → paid → partially_refunded / refunded`, or `failed`.
Every change is appended to `statusHistory` with a note, actor and timestamp, and triggers a notification (in-app + email).

## Checkout (`POST /orders`)

1. **Rate limit + idempotency key** (`X-Idempotency-Key`, 8–100 chars). An existing order for `(user, key)` is returned as is.
2. **Re-price the cart** with `pricing.service.buildCartView` using current variant prices, stock and the saved coupon. Empty carts, stock issues or an invalid coupon → 409/422 with details.
3. **Validate** that the address belongs to the user, and the COD rules.
4. **Allocate** an order number: `Counter` `order-<year>` `$inc` → `ORD-2026-000123`.
5. **One transaction**: create the `Order` with immutable item snapshots (name, image, SKU, price, tax, discount share) → reserve stock → (COD) commit stock → redeem the coupon → create the `Payment`.
   Without replica-set transactions the same steps run with a compensation list that undoes completed steps on failure.
6. **After commit:** clear the cart; COD → `placed` notification; Razorpay → create the gateway order (see `payment-flow.md`).

## Pricing rules (`services/pricing.service.js`)

- Unit price = current variant price (tax exclusive).
- `subtotal` = Σ price × quantity of available lines.
- Coupon discount is computed on the subtotal (percentage with optional cap, or fixed), never above the subtotal, and allocated to lines proportionally.
- `tax` = Σ (line subtotal − line discount) × GST rate of the product.
- `shipping` = 0 when (subtotal − coupon) ≥ `freeShippingThreshold`, otherwise `shippingFee`.
- `codFee` applies to COD only.
- `total = subtotal − couponDiscount + tax + shipping + codFee`, rounded to paise.

## Cancellation

- **Customer:** `POST /orders/:id/cancel { reason }` while `pending | confirmed | processing`.
- **Admin:** `POST /admin/orders/:id/cancel` (or status `cancelled`) before shipping.
- **System:** reservation expiry.

Effects (one transaction): reserved stock is released, or committed stock returned; coupon usage released; `cancellation` recorded; paid orders are refunded automatically.

## Returns

1. Customer: `POST /orders/:id/return { reason, comment }`, only for delivered orders within `returnWindowDays` of `deliveredAt`, and only once.
2. Admin: `PATCH /admin/orders/:id/return { action: approve | reject | complete }`.
3. `complete` → status `returned`, stock returned to `available` (`RETURN` entries), refund initiated. When fully refunded, status becomes `refunded`.

## Customer views

`GET /orders/:id` adds `canCancel`, `canReturn` and `canRetryPayment` so the UI never duplicates business rules. The tracking timeline is built from `statusHistory` and `tracking`.
