import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetRazorpayLoader,
  BRAND_COLOR,
  buildRazorpayOptions,
  loadRazorpayScript,
  openRazorpayCheckout,
  RAZORPAY_SCRIPT_SRC,
} from './razorpay';

const payload = {
  provider: 'razorpay',
  keyId: 'rzp_test_public123',
  razorpayOrderId: 'order_Nx12345',
  amount: 129_900,
  currency: 'INR',
  orderId: '665f1c2a9b1e8a0012345678',
  orderNumber: 'ORD-2026-000042',
  prefill: { name: 'Aarav Sharma', email: 'aarav@example.com', contact: '+919876543210' },
  // Anything the client must never forward to the widget:
  keySecret: 'SUPER_SECRET_VALUE',
  secret: 'ANOTHER_SECRET',
  webhookSecret: 'WEBHOOK_SECRET',
};

class FakeRazorpay {
  static instances = [];
  constructor(options) {
    this.options = options;
    this.handlers = {};
    this.open = vi.fn();
    FakeRazorpay.instances.push(this);
  }
  on(event, callback) {
    this.handlers[event] = callback;
  }
}

const scripts = () => document.querySelectorAll(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);

beforeEach(() => {
  __resetRazorpayLoader();
  delete window.Razorpay;
  scripts().forEach((s) => s.remove());
  FakeRazorpay.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('buildRazorpayOptions', () => {
  it('maps the server payload onto widget options', () => {
    const options = buildRazorpayOptions(payload, { storeName: 'BlueMart' });
    expect(options).toMatchObject({
      key: 'rzp_test_public123',
      amount: 129_900,
      currency: 'INR',
      order_id: 'order_Nx12345',
      name: 'BlueMart',
      prefill: { name: 'Aarav Sharma', email: 'aarav@example.com', contact: '+919876543210' },
      theme: { color: BRAND_COLOR },
    });
    expect(options.description).toContain('ORD-2026-000042');
    expect(typeof options.handler).toBe('function');
    expect(typeof options.modal.ondismiss).toBe('function');
  });

  it('never includes secrets or unknown payload fields', () => {
    const options = buildRazorpayOptions(payload, { storeName: 'BlueMart' });
    const serialised = JSON.stringify(options);
    expect(serialised).not.toMatch(/SECRET/);
    expect(Object.keys(options)).not.toEqual(expect.arrayContaining(['keySecret', 'secret', 'webhookSecret', 'key_secret']));
    expect(Object.keys(options).sort()).toEqual(
      ['amount', 'currency', 'description', 'handler', 'key', 'modal', 'name', 'notes', 'order_id', 'prefill', 'retry', 'theme'].sort(),
    );
  });

  it('defaults the currency to INR and tolerates a missing prefill', () => {
    const { currency: _c, prefill: _p, ...rest } = payload;
    const options = buildRazorpayOptions(rest);
    expect(options.currency).toBe('INR');
    expect(options.prefill).toEqual({ name: '', email: '', contact: '' });
  });
});

describe('openRazorpayCheckout', () => {
  it('opens the widget and wires success, failure and dismiss callbacks', async () => {
    window.Razorpay = FakeRazorpay;
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    const onDismiss = vi.fn();

    const rzp = await openRazorpayCheckout(payload, { storeName: 'BlueMart', onSuccess, onFailure, onDismiss });

    expect(FakeRazorpay.instances).toHaveLength(1);
    expect(rzp.open).toHaveBeenCalledTimes(1);
    expect(rzp.options.key).toBe(payload.keyId);
    expect(rzp.options.order_id).toBe(payload.razorpayOrderId);
    expect(JSON.stringify(rzp.options)).not.toMatch(/SECRET/);

    const response = { razorpay_payment_id: 'pay_1', razorpay_order_id: 'order_Nx12345', razorpay_signature: 'sig' };
    rzp.options.handler(response);
    expect(onSuccess).toHaveBeenCalledWith(response);

    const failure = { error: { code: 'BAD_REQUEST_ERROR', description: 'Card declined' } };
    rzp.handlers['payment.failed'](failure);
    expect(onFailure).toHaveBeenCalledWith(failure);

    rzp.options.modal.ondismiss();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('refuses to open without a key or gateway order', async () => {
    window.Razorpay = FakeRazorpay;
    await expect(openRazorpayCheckout({ ...payload, keyId: undefined })).rejects.toThrow(/missing/i);
    await expect(openRazorpayCheckout({ ...payload, razorpayOrderId: '' })).rejects.toThrow(/missing/i);
    expect(FakeRazorpay.instances).toHaveLength(0);
  });
});

describe('loadRazorpayScript', () => {
  it('injects the official script only once and resolves window.Razorpay', async () => {
    const first = loadRazorpayScript();
    const second = loadRazorpayScript();
    expect(second).toBe(first);
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].async).toBe(true);

    window.Razorpay = FakeRazorpay;
    scripts()[0].dispatchEvent(new Event('load'));
    await expect(first).resolves.toBe(FakeRazorpay);

    await expect(loadRazorpayScript()).resolves.toBe(FakeRazorpay);
    expect(scripts()).toHaveLength(1);
  });

  it('does not inject anything when Razorpay is already available', async () => {
    window.Razorpay = FakeRazorpay;
    await expect(loadRazorpayScript()).resolves.toBe(FakeRazorpay);
    expect(scripts()).toHaveLength(0);
  });

  it('rejects on a network error and allows a later retry', async () => {
    const attempt = loadRazorpayScript();
    scripts()[0].dispatchEvent(new Event('error'));
    await expect(attempt).rejects.toThrow(/could not load/i);
    expect(scripts()).toHaveLength(0);

    const retry = loadRazorpayScript();
    expect(retry).not.toBe(attempt);
    expect(scripts()).toHaveLength(1);
    window.Razorpay = FakeRazorpay;
    scripts()[0].dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBe(FakeRazorpay);
  });

  it('rejects when the script loads but the global is missing', async () => {
    const attempt = loadRazorpayScript();
    scripts()[0].dispatchEvent(new Event('load'));
    await expect(attempt).rejects.toThrow(/initialise/i);
  });

  it('rejects after the timeout', async () => {
    vi.useFakeTimers();
    const attempt = loadRazorpayScript({ timeout: 1000 });
    const assertion = expect(attempt).rejects.toThrow(/too long/i);
    vi.advanceTimersByTime(1000);
    await assertion;
    expect(scripts()).toHaveLength(0);
  });
});
