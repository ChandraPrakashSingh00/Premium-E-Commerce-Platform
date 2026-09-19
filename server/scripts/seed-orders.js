import { INVENTORY_STATE, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, REVIEW_STATUS } from '../src/constants/index.js';
import { Counter, Order, Payment, Product, Review } from '../src/models/index.js';
import { inventoryService } from '../src/services/inventory.service.js';
import { recalculateProductRating } from '../src/services/review.service.js';
import { roundMoney } from '../src/utils/helpers.js';
import { reviewTexts } from './seed-data/reviews.js';

const DAY = 24 * 3600 * 1000;
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 79;

const addressSnapshot = (a) => ({
  fullName: a.fullName,
  phone: a.phone,
  addressLine1: a.addressLine1,
  addressLine2: a.addressLine2 ?? '',
  landmark: a.landmark ?? '',
  city: a.city,
  state: a.state,
  postalCode: a.postalCode,
  country: a.country ?? 'India',
});

/** Picks the active variant with the most stock. */
const pickVariant = (product) =>
  product.variants.filter((v) => v.isActive && v.stock >= 2).sort((a, b) => b.stock - a.stock)[0];

function buildItems(lines) {
  return lines.map(({ product, variant, quantity }) => {
    const lineSubtotal = roundMoney(variant.price * quantity);
    const taxAmount = roundMoney((lineSubtotal * product.taxRate) / 100);
    return {
      product: product._id,
      variant: variant._id,
      name: product.name,
      slug: product.slug,
      image: product.thumbnail,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      brandName: product.brand?.name,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity,
      taxRate: product.taxRate,
      lineSubtotal,
      discountAmount: 0,
      taxAmount,
      lineTotal: roundMoney(lineSubtotal + taxAmount),
    };
  });
}

/**
 * Creates one order that went through the normal stock flow (reserve -> commit),
 * so Inventory, InventoryTransaction and Product.soldCount stay consistent.
 */
async function createOrder({ seq, year, user, address, lines, status, paymentMethod, daysAgo }) {
  const items = buildItems(lines);
  const subtotal = roundMoney(items.reduce((s, i) => s + i.lineSubtotal, 0));
  const tax = roundMoney(items.reduce((s, i) => s + i.taxAmount, 0));
  const discount = roundMoney(items.reduce((s, i) => s + Math.max(0, (i.compareAtPrice - i.price) * i.quantity), 0));
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = roundMoney(subtotal + tax + shipping);
  const placedAt = new Date(Date.now() - daysAgo * DAY);
  const at = (days) => new Date(placedAt.getTime() + days * DAY);
  const delivered = status === ORDER_STATUS.DELIVERED;
  const paid = delivered || paymentMethod === PAYMENT_METHOD.RAZORPAY;

  const history = [
    { status: ORDER_STATUS.PENDING, note: 'Order placed', at: placedAt },
    { status: ORDER_STATUS.CONFIRMED, note: 'Order confirmed', at: at(0.02) },
    { status: ORDER_STATUS.PROCESSING, at: at(0.5) },
  ];
  if (delivered) {
    history.push(
      { status: ORDER_STATUS.PACKED, at: at(1) },
      { status: ORDER_STATUS.SHIPPED, note: 'Shipped via Blue Dart', at: at(1.5) },
      { status: ORDER_STATUS.OUT_FOR_DELIVERY, at: at(3.8) },
      { status: ORDER_STATUS.DELIVERED, note: 'Delivered', at: at(4) },
    );
  }

  const order = await Order.create({
    orderNumber: `ORD-${year}-${String(seq).padStart(6, '0')}`,
    user: user._id,
    items,
    contact: { name: user.name, email: user.email, phone: user.phone ?? address.phone },
    shippingAddress: addressSnapshot(address),
    pricing: { subtotal, discount, couponDiscount: 0, tax, shipping, codFee: 0, total, currency: 'INR' },
    paymentMethod,
    paymentStatus: paid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
    paidAt: paid ? (paymentMethod === PAYMENT_METHOD.COD ? at(4) : placedAt) : undefined,
    status,
    statusHistory: history,
    inventoryState: INVENTORY_STATE.RESERVED,
    tracking: delivered
      ? {
          carrier: 'Blue Dart',
          trackingNumber: `BD${String(70_000_000 + seq * 7919)}IN`,
          trackingUrl: 'https://www.bluedart.com/tracking',
          shippedAt: at(1.5),
          deliveredAt: at(4),
        }
      : {},
  });

  const stockItems = items.map((i) => ({ variant: i.variant, quantity: i.quantity }));
  await inventoryService.reserve(stockItems, { orderId: order._id });
  await inventoryService.commit(stockItems, { orderId: order._id });

  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    method: paymentMethod,
    status: paid ? 'captured' : 'created',
    amount: total,
    ...(paymentMethod === PAYMENT_METHOD.RAZORPAY && {
      razorpayOrderId: `order_seed${String(seq).padStart(8, '0')}`,
      razorpayPaymentId: `pay_seed${String(seq).padStart(10, '0')}`,
      paymentMode: 'upi',
      attempts: [{ razorpayPaymentId: `pay_seed${String(seq).padStart(10, '0')}`, status: 'captured', method: 'upi', source: 'verify', at: placedAt }],
    }),
    capturedAt: paid ? order.paidAt : undefined,
  });

  await Order.collection.updateOne(
    { _id: order._id },
    { $set: { inventoryState: INVENTORY_STATE.COMMITTED, payment: payment._id, createdAt: placedAt, updatedAt: at(delivered ? 4 : 0.5) } },
  );
  await Payment.collection.updateOne({ _id: payment._id }, { $set: { createdAt: placedAt } });
  return order;
}

/**
 * Seeds delivered orders for the demo customer and reviewers, one processing COD
 * order for the customer, and approved verified reviews for delivered items.
 */
export async function seedOrdersAndReviews({ customer, customerAddress, reviewers, products }) {
  const year = new Date().getFullYear();
  const purchasable = products.filter((p) => pickVariant(p));
  let seq = 0;
  let cursor = 0;
  const nextLines = (count) =>
    Array.from({ length: count }, () => {
      const product = purchasable[cursor % purchasable.length];
      cursor += 1;
      return { product, variant: pickVariant(product), quantity: 1 + (cursor % 3 === 0 ? 1 : 0) };
    });

  const buyers = [
    { user: customer, address: customerAddress, orders: 3 },
    ...reviewers.map((r) => ({ user: r.user, address: r.address, orders: 1 })),
  ];

  const delivered = [];
  for (const [b, buyer] of buyers.entries()) {
    for (let o = 0; o < buyer.orders; o += 1) {
      seq += 1;
      const lines = nextLines(buyer.orders > 1 ? 2 : 4);
      const order = await createOrder({
        seq,
        year,
        user: buyer.user,
        address: buyer.address,
        lines,
        status: ORDER_STATUS.DELIVERED,
        paymentMethod: seq % 2 ? PAYMENT_METHOD.RAZORPAY : PAYMENT_METHOD.COD,
        daysAgo: 12 + ((b * 11 + o * 17) % 70),
      });
      delivered.push({ order, user: buyer.user, lines, reviewAll: buyer.user !== customer || o === 0 });
    }
  }

  // An in-progress COD order so the customer's account shows an active order.
  seq += 1;
  await createOrder({
    seq,
    year,
    user: customer,
    address: customerAddress,
    lines: nextLines(1),
    status: ORDER_STATUS.PROCESSING,
    paymentMethod: PAYMENT_METHOD.COD,
    daysAgo: 1,
  });
  await Counter.updateOne({ _id: `order-${year}` }, { $set: { seq } }, { upsert: true });

  // Reviews: every item of reviewer orders + the customer's first order.
  const textCursor = new Map();
  const reviews = [];
  for (const { order, user, lines, reviewAll } of delivered) {
    if (!reviewAll) continue;
    for (const { product } of lines) {
      const key = reviewTexts[product.topCategorySlug] ? product.topCategorySlug : 'default';
      const idx = textCursor.get(key) ?? 0;
      textCursor.set(key, idx + 1);
      const text = reviewTexts[key][idx % reviewTexts[key].length];
      reviews.push({
        product: product._id,
        user: user._id,
        order: order._id,
        ...text,
        isVerifiedPurchase: true,
        helpfulCount: 0,
        status: REVIEW_STATUS.APPROVED,
        moderatedAt: new Date(),
      });
    }
  }
  // Same user may have bought the same product twice via the rotation: keep the first.
  const unique = [...new Map(reviews.map((r) => [`${r.product}-${r.user}`, r])).values()];
  const voterIds = buyers.map((b) => b.user._id);
  unique.forEach((r, k) => {
    r.helpfulBy = voterIds.filter((id, j) => String(id) !== String(r.user) && (j + k) % 3 === 0);
    r.helpfulCount = r.helpfulBy.length;
  });
  await Review.insertMany(unique);
  await Promise.all(
    delivered.map(({ order }) =>
      Order.updateOne({ _id: order._id }, { $set: { 'items.$[i].isReviewed': true } }, {
        arrayFilters: [{ 'i.product': { $in: unique.filter((r) => String(r.order) === String(order._id)).map((r) => r.product) } }],
      }),
    ),
  );
  const reviewedIds = [...new Set(unique.map((r) => String(r.product)))];
  for (const id of reviewedIds) await recalculateProductRating(id);

  // Historic sales outside the seeded orders make best-seller sorting meaningful.
  await Product.bulkWrite(
    products.map((p, i) => ({
      updateOne: { filter: { _id: p._id }, update: { $inc: { soldCount: (p.isBestSeller ? 120 : 8) + ((i * 53) % 90) } } },
    })),
  );

  return { orders: seq, reviews: unique.length };
}
