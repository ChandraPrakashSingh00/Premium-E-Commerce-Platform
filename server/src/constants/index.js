export const ROLES = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN' });

export const USER_STATUS = Object.freeze({ ACTIVE: 'active', BLOCKED: 'blocked' });

export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
});

/** Allowed order status transitions. Anything not listed is rejected. */
export const ORDER_TRANSITIONS = Object.freeze({
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
  returned: ['refunded'],
  cancelled: ['refunded'],
  refunded: [],
});

/** Statuses in which the customer may still cancel. */
export const CUSTOMER_CANCELLABLE = Object.freeze(['pending', 'confirmed', 'processing']);

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

export const PAYMENT_METHOD = Object.freeze({ RAZORPAY: 'razorpay', COD: 'cod' });

/** Status of a single payment record (one per Razorpay order / COD collection). */
export const PAYMENT_RECORD_STATUS = Object.freeze({
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

export const REFUND_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
});

export const RETURN_STATUS = Object.freeze({
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
});

/** Where the order's stock currently sits. */
export const INVENTORY_STATE = Object.freeze({
  RESERVED: 'reserved',
  COMMITTED: 'committed',
  RELEASED: 'released',
  RETURNED: 'returned',
});

export const INVENTORY_TXN = Object.freeze({
  RESERVE: 'RESERVE',
  RELEASE: 'RELEASE',
  SALE: 'SALE',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT',
});

export const COUPON_TYPE = Object.freeze({ PERCENTAGE: 'percentage', FIXED: 'fixed' });

export const REVIEW_STATUS = Object.freeze({ PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' });

export const NOTIFICATION_TYPE = Object.freeze({
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  ORDER_PLACED: 'order_placed',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  ORDER_STATUS: 'order_status',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  REFUND: 'refund',
  RETURN: 'return',
  SYSTEM: 'system',
});

export const PRODUCT_SORT = Object.freeze({
  featured: { isFeatured: -1, soldCount: -1, _id: -1 },
  newest: { createdAt: -1, _id: -1 },
  'price-low': { price: 1, _id: 1 },
  'price-high': { price: -1, _id: -1 },
  rating: { ratingAverage: -1, reviewCount: -1, _id: -1 },
  'best-selling': { soldCount: -1, _id: -1 },
  discount: { discount: -1, _id: -1 },
});

export const PAGINATION = Object.freeze({ DEFAULT_LIMIT: 12, MAX_LIMIT: 100 });

export const UPLOAD = Object.freeze({
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_FILES: 8,
  ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
});
