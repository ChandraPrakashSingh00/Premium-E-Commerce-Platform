import { describe, expect, it } from 'vitest';
import { checkoutCta, checkoutStages, stageForStep } from './progress';

const statuses = (stage) => checkoutStages(stage).map((s) => `${s.key}:${s.status}`);

describe('checkout stepper mapping', () => {
  it('maps the internal contact/shipping steps onto "Address"', () => {
    expect(stageForStep(1)).toBe('address');
    expect(stageForStep(2)).toBe('address');
  });

  it('maps the internal review/payment steps onto "Payment"', () => {
    expect(stageForStep(3)).toBe('payment');
    expect(stageForStep(4)).toBe('payment');
  });

  it('marks the cart complete and address current while collecting details', () => {
    expect(statuses('address')).toEqual(['cart:complete', 'address:current', 'payment:upcoming', 'success:upcoming']);
  });

  it('marks address complete once the customer reaches payment', () => {
    expect(statuses('payment')).toEqual(['cart:complete', 'address:complete', 'payment:current', 'success:upcoming']);
  });

  it('marks every stage complete on the success page', () => {
    expect(checkoutStages('success').every((s) => s.status === 'complete')).toBe(true);
    expect(checkoutStages('success').map((s) => s.number)).toEqual([1, 2, 3, 4]);
  });
});

describe('checkout CTA', () => {
  it('labels each internal step', () => {
    expect(checkoutCta({ step: 1 }).label).toBe('Continue to Address');
    expect(checkoutCta({ step: 2 }).label).toBe('Deliver to this Address');
    expect(checkoutCta({ step: 2, addingAddress: true })).toMatchObject({ label: 'Save & Deliver Here', shortLabel: 'Save Address' });
    expect(checkoutCta({ step: 2 }).shortLabel).toBe('Deliver Here');
    expect(checkoutCta({ step: 3 }).label).toBe('Proceed to Payment');
    expect(checkoutCta({ step: 4, paymentMethod: 'cod' })).toMatchObject({ label: 'Place Order', final: true });
    expect(checkoutCta({ step: 4, paymentMethod: 'razorpay' }).label).toBe('Pay Now');
  });

  it('blocks review with cart issues and payment with blockers or a pending quote', () => {
    expect(checkoutCta({ step: 3, hasIssues: true }).disabled).toBe(true);
    expect(checkoutCta({ step: 4, blockers: ['x'] }).disabled).toBe(true);
    expect(checkoutCta({ step: 4, quote: { isFetching: true, data: undefined } }).disabled).toBe(true);
    expect(checkoutCta({ step: 4, quote: { isFetching: true, data: {} } }).disabled).toBe(false);
    expect(checkoutCta({ step: 1, hasIssues: true }).disabled).toBe(false);
  });
});
