# Inventory Flow

## Model

One `Inventory` document per `ProductVariant` (the source of truth):

| Field | Meaning |
| --- | --- |
| `available` | Can be sold right now |
| `reserved` | Held by unpaid orders |
| `sold` | Committed to confirmed orders |
| `lowStockThreshold` | `available ≤ threshold` ⇒ low stock (dashboard, inventory filters, log warning) |

`ProductVariant.stock` and `Product.stock` (sum over active variants), as well as `Product.price` and `Product.options`, are denormalised copies refreshed by `syncProductAggregates()` (`services/productSync.service.js`) after every movement. Listing and filter queries never join inventory.

Every movement writes an `InventoryTransaction` (ledger) with a signed quantity and the resulting `available / reserved / sold`, the order, reason and actor.

| Type | Effect | Trigger |
| --- | --- | --- |
| `RESERVE` | available −q, reserved +q | order created |
| `RELEASE` | reserved −q, available +q | unpaid order cancelled / expired |
| `SALE` | reserved −q, sold +q | payment confirmed or COD order placed (also `Product.soldCount` +q) |
| `RETURN` | sold −q, available +q | cancellation after commit, completed return |
| `ADJUSTMENT` | available set / ± q | admin stock change (reason required), initial stock |

## Flow

```
Checkout ──RESERVE──▶ reserved ──payment success──SALE──▶ sold ──return/cancel──RETURN──▶ available
                         │
                         └──payment failed + reservation expired / cancel──RELEASE──▶ available
```

COD orders reserve and commit in the same transaction.

## Preventing overselling

Each movement is a **conditional atomic update**, for example:

```js
Inventory.findOneAndUpdate(
  { _id, available: { $gte: qty } },
  { $inc: { available: -qty, reserved: qty } },
);
```

If no document matches, the request fails with **409 Insufficient stock** and everything reserved earlier in the same checkout is rolled back. The database guarantees that only as many concurrent buyers as there are units succeed (covered by tests with and without transactions).

## Idempotency

The ledger has a unique partial index on `(order, variant, type)`. Each order-linked movement writes its ledger entry first:

- inside a transaction, an existing entry is detected by reading first, so a retried confirmation is a no-op;
- without transactions, a duplicate-key error skips that line, and partial work is compensated (stock movements reversed, ledger entries removed).

Webhook redelivery, double "verify" calls and the expiry job can therefore never double-commit or double-release stock.

## Admin

- `GET /admin/inventory?status=in|low|out&q=` – per-SKU stock with product/variant info and `{ totalSkus, lowStock, outOfStock }`.
- `PATCH /admin/inventory/:id { mode: set|increment|decrement, quantity, reason, lowStockThreshold? }` – audited `ADJUSTMENT`. Decrements can never go below zero, and reserved units are untouched.
- `GET /admin/inventory/transactions` – full history, filterable by type, SKU or product.
- Product edits never change existing stock; new variants may carry initial stock.
