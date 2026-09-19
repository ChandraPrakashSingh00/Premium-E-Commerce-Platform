# Payment Flow (Razorpay + COD)

The server is the only authority on amounts and payment status. The browser never sends a price and a client-side "success" callback never marks an order as paid on its own.

## Online payment (Razorpay)

```
Browser                      API                                  Razorpay
───────                      ───                                  ────────
POST /orders  ─────────────▶ price cart (pricing.service)
(X-Idempotency-Key)          create Order  (pending, reserved)
                             reserve stock, redeem coupon
                             create Payment (created)
                             orders.create(amount in paise) ───▶  order_XXXX
◀──────── { order, payment: { keyId, razorpayOrderId, amount } }
open Checkout.js  ───────────────────────────────────────────────▶ customer pays
◀─────────────────────────── razorpay_payment_id + signature ─────
POST /payments/razorpay/verify ─▶ HMAC_SHA256(order_id|payment_id, key_secret)
                                  == signature (constant-time)?
                                  payments.fetch(id) → captured/authorized, amount matches
                                  confirmPayment()  ← idempotent
◀──────── { order (paid, confirmed) }
                                                   ◀── webhook payment.captured / order.paid
                             verify X-Razorpay-Signature over raw body
                             dedupe by x-razorpay-event-id (WebhookEvent)
                             confirmPayment()  ← no-op if already paid
```

### `confirmPayment` (services/orderLifecycle.service.js)

One conditional update claims the order: `status: pending, inventoryState: reserved, paymentStatus ≠ paid` → `paid / confirmed / committed`. Whichever caller wins (verify endpoint, webhook, expiry job) does the work; the others see nothing to do. In the same transaction the reserved stock is converted to sold (`SALE` ledger entries) and the `Payment` becomes `captured`. Notifications (`placed`, `paid`) are de-duplicated with `order.notificationsSent`.

Late payments:

- captured after the system auto-cancelled the order → the order is reinstated if stock can still be taken, otherwise it stays cancelled and a full refund is issued;
- captured after a customer/admin cancellation → refunded automatically.

### Failure, cancellation, pending

| Situation | Handling |
| --- | --- |
| Customer closes the Razorpay window | Client calls `POST /payments/razorpay/failure { cancelled: true }` → attempt logged; order stays `pending` so the customer can retry (`POST /orders/:id/pay`). |
| Card/UPI failure | Client reports it and the `payment.failed` webhook confirms it → `Payment.status = failed`, `order.paymentStatus = failed`, "payment failed" notification. Retrying is still possible while the reservation is valid. |
| Signature mismatch | 400 *Payment verification failed*; attempt recorded; order untouched. |
| Paid but browser never returned | The webhook confirms the order. The success page polls the order for ~30 s while payment is pending. |
| Never paid | `jobs/index.js` runs every 60 s: orders still reserved after `reservationTtlMinutes` (default 30) are checked against Razorpay (a captured payment → confirm) and otherwise cancelled by `system`, releasing stock and coupon usage. |
| Gateway down when creating the order | 502; the just-created order is cancelled so no stock stays reserved. |

### Idempotency

- **Checkout:** unique index `(user, idempotencyKey)` on `Order`. The client keeps one key per checkout attempt in `sessionStorage`, so double clicks, retries and refreshes return the same order (200 instead of 201).
- **Webhooks:** `WebhookEvent (provider, eventId)` is unique; the event is claimed before processing. Failures delete the claim and return 500 so Razorpay retries; claims stuck in `processing` for more than 5 minutes can be taken over.
- **Stock and coupons:** ledger and usage documents carry unique keys per order (see `inventory-flow.md`).

## Refunds (services/refund.service.js)

`initiateRefund(order, { amount?, reason })` is used by customer cancellation of a paid order, admin cancellation, admin refunds and completed returns.

1. The amount (default: remaining refundable) is reserved on `Payment.amountRefunded` with an optimistic check, so two concurrent refunds cannot exceed the captured amount (409).
2. `razorpay.payments.refund(paymentId, paise)` is called. On a gateway error the reservation is rolled back.
3. `Payment.refunds[]`, `order.refund` (`pending`/`processed`) and `order.paymentStatus` (`refunded` / `partially_refunded`) are updated. A fully refunded cancelled/returned order moves to `refunded`.
4. `refund.processed` / `refund.failed` webhooks finalise the status and send the refund notification.

COD orders that were collected and later returned are marked refunded manually (money is returned outside the gateway).

## Cash on Delivery

- Allowed when `settings.codEnabled` and the COD total (including `codFee`) ≤ `codMaxOrderAmount`.
- The order is created as `confirmed` with stock **committed** immediately (one transaction).
- `paymentStatus` stays `pending` until the order is delivered (automatically set to `paid`) or an admin marks it paid (`PATCH /admin/orders/:id/payment-status`).

## Configuration

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` on the server only. The public key id reaches the browser through the checkout response (`payment.keyId`) and `GET /payments/config`. Without keys, the API reports `razorpayEnabled: false`, the checkout disables online payment and only COD is offered.

Webhook URL: `https://<api-host>/api/v1/payments/razorpay/webhook`. Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`.
