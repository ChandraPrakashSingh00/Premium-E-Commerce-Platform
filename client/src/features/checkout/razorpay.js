/**
 * Razorpay Checkout integration. Only the public key id and the server-created
 * gateway order are ever handed to the widget – no secrets live in the client,
 * and the payment result is always verified server-side.
 */
export const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
export const BRAND_COLOR = '#086FFD';

let loader = null;

/** Injects the official checkout script once and resolves `window.Razorpay`. */
export function loadRazorpayScript({ timeout = 15_000 } = {}) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay is only available in the browser'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    const cleanup = () => {
      clearTimeout(timer);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
    const fail = (message) => {
      cleanup();
      script.remove();
      loader = null; // allow a later retry
      reject(new Error(message));
    };
    function onLoad() {
      if (!window.Razorpay) return fail('Payment gateway failed to initialise. Please try again.');
      cleanup();
      resolve(window.Razorpay);
    }
    function onError() {
      fail('Could not load the payment gateway. Check your connection and try again.');
    }

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    const timer = setTimeout(() => fail('The payment gateway took too long to load. Please try again.'), timeout);
  });
  return loader;
}

/** Test helper – forgets the cached loader. */
export const __resetRazorpayLoader = () => {
  loader = null;
};

/** Maps the server `RazorpayCheckout` payload onto Razorpay widget options (whitelisted fields only). */
export function buildRazorpayOptions(payment, { storeName = 'BlueMart', onSuccess, onDismiss } = {}) {
  const prefill = payment?.prefill ?? {};
  return {
    key: payment.keyId,
    amount: payment.amount,
    currency: payment.currency || 'INR',
    order_id: payment.razorpayOrderId,
    name: storeName,
    description: payment.orderNumber ? `Order ${payment.orderNumber}` : 'Order payment',
    prefill: {
      name: prefill.name || '',
      email: prefill.email || '',
      contact: prefill.contact || '',
    },
    notes: { orderNumber: payment.orderNumber || '' },
    theme: { color: BRAND_COLOR },
    retry: { enabled: true },
    handler: (response) => onSuccess?.(response),
    modal: {
      ondismiss: () => onDismiss?.(),
      escape: true,
      confirm_close: true,
    },
  };
}

/**
 * Opens the Razorpay modal for a server-created payment.
 * `onSuccess(response)` receives `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`
 * which must be sent to the server for verification.
 */
export async function openRazorpayCheckout(payment, { storeName, onSuccess, onFailure, onDismiss } = {}) {
  if (!payment?.keyId || !payment?.razorpayOrderId) throw new Error('Payment details are missing. Please try again.');
  const Razorpay = await loadRazorpayScript();
  const rzp = new Razorpay(buildRazorpayOptions(payment, { storeName, onSuccess, onDismiss }));
  rzp.on('payment.failed', (response) => onFailure?.(response));
  rzp.open();
  return rzp;
}
