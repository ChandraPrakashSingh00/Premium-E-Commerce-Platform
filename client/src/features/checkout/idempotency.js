const STORAGE_KEY = 'bluemart-checkout-attempt';

const uuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const read = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const write = (value) => {
  try {
    if (value) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable – the in-memory key still protects this page view */
  }
};

/** Stable signature of what is being bought (lines + coupon + address + method). */
export const checkoutSignature = (cart, extra = {}) => {
  const lines = (cart?.items ?? [])
    .map((i) => `${i.variantId}:${i.quantity}`)
    .sort()
    .join('|');
  return [lines, cart?.coupon?.code ?? '', extra.addressId ?? '', extra.paymentMethod ?? ''].join('#');
};

/**
 * One idempotency key per checkout attempt. A retry or refresh with the same
 * signature reuses the key (so the server returns the same order); any change
 * to the cart/address/method produces a fresh key.
 */
export function getIdempotencyKey(signature) {
  const stored = read();
  if (stored?.signature === signature && stored.key) return stored.key;
  const key = uuid();
  write({ signature, key });
  return key;
}

/** Forget the key once the server has answered (order exists → retries go through /orders/:id/pay). */
export const clearIdempotencyKey = () => write(null);
