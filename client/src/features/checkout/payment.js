import { queryClient } from '@/services/queryClient';
import { checkoutApi } from './api';
import { openRazorpayCheckout } from './razorpay';

const clip = (value, max) => (typeof value === 'string' ? value.slice(0, max) : undefined);

/**
 * Runs the full Razorpay flow for a server-issued payment and reports the outcome
 * to the server. Never trusts the widget: success is only what /verify returns.
 *
 * Resolves to one of:
 *  - `{ outcome: 'paid', order }`
 *  - `{ outcome: 'pending' }`   – verification could not be confirmed yet (network/5xx); webhook will settle it
 *  - `{ outcome: 'failed', reason }`
 *  - `{ outcome: 'cancelled', reason }`
 * Rejects only when the gateway script cannot be loaded/opened.
 */
export function payWithRazorpay(payment, { storeName } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let lastFailure = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      resolve(result);
    };

    const onSuccess = async (response) => {
      try {
        const { order } = await checkoutApi.verifyPayment({
          orderId: payment.orderId,
          razorpayOrderId: response.razorpay_order_id || payment.razorpayOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        finish(order?.paymentStatus === 'paid' ? { outcome: 'paid', order } : { outcome: 'pending', order });
      } catch (error) {
        if (!error?.status || error.status >= 500) finish({ outcome: 'pending' });
        else finish({ outcome: 'failed', reason: error.message || 'We could not verify your payment.' });
      }
    };

    // Razorpay keeps the modal open after a failed attempt so the customer can retry;
    // record every failure, and only leave the flow when the modal is dismissed.
    const onFailure = (response) => {
      const err = response?.error ?? {};
      lastFailure = err.description || 'Your payment could not be completed.';
      checkoutApi
        .reportFailure({
          orderId: payment.orderId,
          razorpayOrderId: err.metadata?.order_id || payment.razorpayOrderId,
          error: {
            code: clip(err.code, 100),
            description: clip(err.description, 500),
            reason: clip(err.reason, 200),
            paymentId: clip(err.metadata?.payment_id, 64),
          },
        })
        .catch(() => {});
    };

    const onDismiss = () => {
      if (lastFailure) return finish({ outcome: 'failed', reason: lastFailure });
      checkoutApi
        .reportFailure({ orderId: payment.orderId, razorpayOrderId: payment.razorpayOrderId, cancelled: true })
        .catch(() => {});
      return finish({ outcome: 'cancelled', reason: 'Payment was cancelled before completion.' });
    };

    openRazorpayCheckout(payment, { storeName, onSuccess, onFailure, onDismiss }).catch((error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

/** Where to send the customer after a payment attempt. */
export function paymentResultPath(orderId, result) {
  const id = encodeURIComponent(orderId);
  if (result.outcome === 'paid' || result.outcome === 'pending') return `/checkout/success?order=${id}`;
  const reason = result.reason ? `&reason=${encodeURIComponent(result.reason)}` : '';
  return `/checkout/failure?order=${id}${reason}`;
}
