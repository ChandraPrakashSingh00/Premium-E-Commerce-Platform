import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { settingsService } from '../src/services/settings.service.js';
import { dateFrom, dateTo } from '../src/validators/common.validator.js';
import { addToCart, setupShopper } from './commerceHelpers.js';
import { app } from './helpers.js';

describe('date range validators', () => {
  it('expands bare dates to the whole IST day', () => {
    expect(dateFrom.parse('2026-09-17').toISOString()).toBe('2026-09-16T18:30:00.000Z');
    expect(dateTo.parse('2026-09-17').toISOString()).toBe('2026-09-17T18:29:59.999Z');
  });

  it('keeps full timestamps unchanged and rejects garbage', () => {
    expect(dateTo.parse('2026-09-17T10:00:00Z').toISOString()).toBe('2026-09-17T10:00:00.000Z');
    expect(dateFrom.safeParse('not-a-date').success).toBe(false);
  });
});

describe('COD availability in quotes', () => {
  it('judges COD on the total including the COD fee, whatever method is quoted', async () => {
    // 1000 + 18% GST = 1180 (free shipping). With a ₹49 COD fee the COD total is 1229.
    await settingsService.update({ codEnabled: true, codFee: 49, codMaxOrderAmount: 1200 });
    const ctx = await setupShopper({ price: 1000 });
    await addToCart(ctx.agent, ctx.variant._id, 1);

    const online = await ctx.agent.post('/api/v1/orders/quote').send({ paymentMethod: 'razorpay' });
    expect(online.status).toBe(200);
    expect(online.body.data.summary.total).toBe(1180);
    expect(online.body.data.codAvailable).toBe(false);

    const cod = await ctx.agent.post('/api/v1/orders/quote').send({ paymentMethod: 'cod' });
    expect(cod.body.data.summary.total).toBe(1229);
    expect(cod.body.data.codAvailable).toBe(false);

    await settingsService.update({ codMaxOrderAmount: 1300 });
    const allowed = await ctx.agent.post('/api/v1/orders/quote').send({ paymentMethod: 'razorpay' });
    expect(allowed.body.data.codAvailable).toBe(true);
  });
});

describe('error handling', () => {
  it('returns 400 (not 500) for malformed URL encoding', async () => {
    const res = await request(app).get('/api/v1/products/bad-%E0%A4');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
