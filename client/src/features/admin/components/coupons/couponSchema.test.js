import { couponFormSchema, formatDiscount, toCouponFormValues, toCouponPayload } from './couponSchema';

const valid = {
  code: 'save20',
  description: 'Twenty off',
  discountType: 'percentage',
  discountValue: '20',
  maxDiscount: '500',
  minOrderAmount: '999',
  startsAt: '2026-01-01T10:00',
  expiresAt: '2026-02-01T10:00',
  usageLimit: '0',
  perUserLimit: '1',
  isActive: true,
};

const issuesFor = (input) => {
  const result = couponFormSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('couponFormSchema', () => {
  it('parses valid input, uppercasing the code and coercing numbers', () => {
    const result = couponFormSchema.parse(valid);
    expect(result.code).toBe('SAVE20');
    expect(result.discountValue).toBe(20);
    expect(result.maxDiscount).toBe(500);
    expect(result.perUserLimit).toBe(1);
  });

  it('rejects invalid codes', () => {
    expect(issuesFor({ ...valid, code: 'ab' }).code).toMatch(/at least 3/);
    expect(issuesFor({ ...valid, code: 'SAVE 20' }).code).toMatch(/letters, numbers/);
    expect(issuesFor({ ...valid, code: 'X'.repeat(31) }).code).toBeDefined();
  });

  it('caps percentage discounts at 100 but not fixed ones', () => {
    expect(issuesFor({ ...valid, discountValue: '101' }).discountValue).toMatch(/cannot exceed 100/);
    expect(issuesFor({ ...valid, discountType: 'fixed', discountValue: '101' }).discountValue).toBeUndefined();
  });

  it('requires a positive discount', () => {
    expect(issuesFor({ ...valid, discountValue: '0' }).discountValue).toMatch(/greater than 0/);
  });

  it('requires expiry after start', () => {
    expect(issuesFor({ ...valid, expiresAt: '2025-12-31T10:00' }).expiresAt).toMatch(/after start/);
    expect(issuesFor({ ...valid, expiresAt: '' }).expiresAt).toMatch(/required/);
    expect(issuesFor({ ...valid, startsAt: '' }).expiresAt).toBeUndefined();
  });

  it('limits perUserLimit to 1–100 and usageLimit to non-negative integers', () => {
    expect(issuesFor({ ...valid, perUserLimit: '0' }).perUserLimit).toBeDefined();
    expect(issuesFor({ ...valid, perUserLimit: '101' }).perUserLimit).toBeDefined();
    expect(issuesFor({ ...valid, usageLimit: '-1' }).usageLimit).toBeDefined();
    expect(issuesFor({ ...valid, usageLimit: '1.5' }).usageLimit).toBeDefined();
  });

  it('round-trips default form values into a valid payload with ISO dates', () => {
    const parsed = couponFormSchema.parse({ ...toCouponFormValues(), code: 'WELCOME', discountValue: '10' });
    const payload = toCouponPayload(parsed);
    expect(payload.expiresAt).toMatch(/Z$/);
    expect(new Date(payload.expiresAt) > new Date(payload.startsAt)).toBe(true);
  });

  it('drops the cap for fixed coupons', () => {
    const parsed = couponFormSchema.parse({ ...valid, discountType: 'fixed', discountValue: '200' });
    expect(toCouponPayload(parsed).maxDiscount).toBe(0);
  });
});

describe('formatDiscount', () => {
  it('formats percentage and fixed discounts', () => {
    expect(formatDiscount({ discountType: 'percentage', discountValue: 20, maxDiscount: 500 })).toBe('20% · max ₹500');
    expect(formatDiscount({ discountType: 'percentage', discountValue: 15, maxDiscount: 0 })).toBe('15%');
    expect(formatDiscount({ discountType: 'fixed', discountValue: 200 })).toBe('₹200 off');
  });
});
