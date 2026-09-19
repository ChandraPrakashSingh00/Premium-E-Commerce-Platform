import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Coupon, CouponUsage } from '../src/models/index.js';
import { couponService } from '../src/services/coupon.service.js';
import { withTransaction } from '../src/utils/transaction.js';
import { app, createAdmin, createUser, loginAs } from './helpers.js';

const DAY = 24 * 60 * 60 * 1000;
const oid = () => new mongoose.Types.ObjectId();

const makeCoupon = (overrides = {}) =>
  Coupon.create({
    code: `C${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    discountType: 'fixed',
    discountValue: 100,
    startsAt: new Date(Date.now() - DAY),
    expiresAt: new Date(Date.now() + DAY),
    ...overrides,
  });

describe('coupon service', () => {
  let user;
  beforeEach(async () => {
    user = await createUser();
  });

  it('computes percentage discounts with a cap and never above the subtotal', async () => {
    const pct = await makeCoupon({ discountType: 'percentage', discountValue: 50, maxDiscount: 300 });
    expect((await couponService.validateForUser(pct.code, { userId: user._id, subtotal: 1000 })).discountAmount).toBe(300);
    const fixed = await makeCoupon({ discountValue: 500 });
    expect((await couponService.validateForUser(fixed.code, { userId: user._id, subtotal: 200 })).discountAmount).toBe(200);
  });

  it('rejects scheduled coupons', async () => {
    const c = await makeCoupon({ startsAt: new Date(Date.now() + DAY), expiresAt: new Date(Date.now() + 2 * DAY) });
    await expect(couponService.validateForUser(c.code, { subtotal: 1000 })).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringMatching(/not active yet/),
    });
  });

  it('allows exactly one of three concurrent redemptions when perUserLimit is 1 (no transaction)', async () => {
    const c = await makeCoupon({ perUserLimit: 1 });
    const results = await Promise.allSettled(
      [1, 2, 3].map(() => couponService.redeem(c._id, { userId: user._id, orderId: oid(), discountAmount: 100 })),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected').every((r) => r.reason.statusCode === 422)).toBe(true);
    expect(await CouponUsage.countDocuments({ coupon: c._id })).toBe(1);
    expect((await Coupon.findById(c._id)).usedCount).toBe(1);
  });

  it('allows exactly one of three concurrent redemptions inside transactions', async () => {
    const c = await makeCoupon({ perUserLimit: 1 });
    const results = await Promise.allSettled(
      [1, 2, 3].map(() =>
        withTransaction((session) =>
          couponService.redeem(c._id, { userId: user._id, orderId: oid(), discountAmount: 100, session }),
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await CouponUsage.countDocuments({ coupon: c._id })).toBe(1);
    expect((await Coupon.findById(c._id)).usedCount).toBe(1);
  });

  it('enforces the global usage limit and releases usage', async () => {
    const c = await makeCoupon({ usageLimit: 2, perUserLimit: 5 });
    const users = await Promise.all([createUser(), createUser(), createUser()]);
    const orders = users.map(() => oid());
    const results = await Promise.allSettled(
      users.map((u, i) => couponService.redeem(c._id, { userId: u._id, orderId: orders[i], discountAmount: 100 })),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
    expect((await Coupon.findById(c._id)).usedCount).toBe(2);
    await expect(couponService.validateForUser(c.code, { userId: user._id, subtotal: 500 })).rejects.toMatchObject({
      message: expect.stringMatching(/usage limit/),
    });

    const winner = orders[results.findIndex((r) => r.status === 'fulfilled')];
    expect(await couponService.release(winner)).toBe(true);
    expect(await couponService.release(winner)).toBe(false);
    expect((await Coupon.findById(c._id)).usedCount).toBe(1);
  });

  it('is idempotent per order and uses successive slots for multi-use coupons', async () => {
    const c = await makeCoupon({ perUserLimit: 2 });
    const orderId = oid();
    await couponService.redeem(c._id, { userId: user._id, orderId, discountAmount: 100 });
    await couponService.redeem(c._id, { userId: user._id, orderId, discountAmount: 100 });
    await couponService.redeem(c._id, { userId: user._id, orderId: oid(), discountAmount: 100 });
    await expect(
      couponService.redeem(c._id, { userId: user._id, orderId: oid(), discountAmount: 100 }),
    ).rejects.toMatchObject({ statusCode: 422 });
    expect((await CouponUsage.find({ coupon: c._id }).sort({ slot: 1 })).map((u) => u.slot)).toEqual([1, 2]);
    expect((await Coupon.findById(c._id)).usedCount).toBe(2);
    await expect(couponService.validateForUser(c.code, { userId: user._id, subtotal: 500 })).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});

describe('coupon endpoints', () => {
  it('lists available coupons publicly', async () => {
    await makeCoupon({ code: 'LIVE' });
    await makeCoupon({ code: 'OFF', isActive: false });
    const res = await request(app).get('/api/v1/coupons/available');
    expect(res.status).toBe(200);
    expect(res.body.data.map((c) => c.code)).toEqual(['LIVE']);
  });

  it('supports admin CRUD with status filters and blocks deleting used coupons', async () => {
    const admin = await loginAs(await createAdmin());
    const created = await admin.post('/api/v1/admin/coupons').send({
      code: 'welcome20',
      discountType: 'percentage',
      discountValue: 20,
      expiresAt: new Date(Date.now() + 5 * DAY).toISOString(),
    });
    expect(created.status).toBe(201);
    expect(created.body.data.code).toBe('WELCOME20');

    const dup = await admin.post('/api/v1/admin/coupons').send({
      code: 'WELCOME20',
      discountType: 'fixed',
      discountValue: 20,
      expiresAt: new Date(Date.now() + 5 * DAY).toISOString(),
    });
    expect(dup.status).toBe(409);

    const bad = await admin.post('/api/v1/admin/coupons').send({
      code: 'TOOMUCH',
      discountType: 'percentage',
      discountValue: 120,
      expiresAt: new Date(Date.now() + 5 * DAY).toISOString(),
    });
    expect(bad.status).toBe(422);

    await makeCoupon({ code: 'EXPIRED1', startsAt: new Date(Date.now() - 3 * DAY), expiresAt: new Date(Date.now() - DAY) });
    const expired = await admin.get('/api/v1/admin/coupons?status=expired');
    expect(expired.body.data.items.map((c) => c.code)).toEqual(['EXPIRED1']);
    expect(expired.body.data.items[0].isExpired).toBe(true);

    const id = created.body.data._id;
    const patched = await admin.patch(`/api/v1/admin/coupons/${id}`).send({ discountValue: 25 });
    expect(patched.body.data.discountValue).toBe(25);
    const status = await admin.patch(`/api/v1/admin/coupons/${id}/status`).send({ isActive: false });
    expect(status.body.data.isActive).toBe(false);

    const customer = await createUser();
    await couponService.redeem(id, { userId: customer._id, orderId: oid(), discountAmount: 10 }).catch(() => {});
    await Coupon.updateOne({ _id: id }, { $set: { isActive: true } });
    await couponService.redeem(id, { userId: customer._id, orderId: oid(), discountAmount: 10 });
    const detail = await admin.get(`/api/v1/admin/coupons/${id}`);
    expect(detail.body.data.usages).toHaveLength(1);
    expect(detail.body.data.usages[0].user.email).toBe(customer.email);

    const del = await admin.delete(`/api/v1/admin/coupons/${id}`);
    expect(del.status).toBe(409);
  });
});
