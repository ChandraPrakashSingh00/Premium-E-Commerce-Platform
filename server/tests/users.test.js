import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Address, Order, Review, Wishlist } from '../src/models/index.js';
import { app, createAddress, createProduct, createUser, loginAs } from './helpers.js';

const addressInput = (overrides = {}) => ({
  fullName: 'Kabir Mehta',
  phone: '9876543210',
  addressLine1: '12 MG Road',
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411001',
  ...overrides,
});

const orderDoc = (user, product, variant, overrides = {}) => ({
  orderNumber: `ORD-2026-${Math.random().toString().slice(2, 8)}`,
  user: user._id,
  items: [
    {
      product: product._id,
      variant: variant._id,
      name: product.name,
      slug: product.slug,
      sku: variant.sku,
      price: 500,
      quantity: 2,
      lineSubtotal: 1000,
      lineTotal: 1000,
    },
  ],
  contact: { name: user.name, email: user.email, phone: '9876543210' },
  shippingAddress: addressInput(),
  pricing: { subtotal: 1000, total: 1000 },
  paymentMethod: 'razorpay',
  ...overrides,
});

describe('users: profile & preferences', () => {
  it('updates the profile and preferences', async () => {
    const user = await createUser({ phone: '9999999999' });
    const agent = await loginAs(user);

    const res = await agent.patch('/api/v1/users/me').send({ name: 'New Name', phone: '', avatar: 'https://example.com/a.png' });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: 'New Name', avatar: 'https://example.com/a.png' });
    expect(res.body.data.user.phone).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();

    expect((await agent.patch('/api/v1/users/me').send({})).status).toBe(422);
    expect((await agent.patch('/api/v1/users/me').send({ role: 'ADMIN' })).status).toBe(422);

    const prefs = await agent.patch('/api/v1/users/me/preferences').send({ newsletter: true });
    expect(prefs.status).toBe(200);
    expect(prefs.body.data.user.preferences).toEqual({ newsletter: true, orderUpdates: true, promotions: false });
    expect(prefs.body.data.user.role).toBe('USER');
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/v1/users/me/addresses')).status).toBe(401);
  });
});

describe('users: addresses', () => {
  it('handles CRUD and default address rules', async () => {
    const user = await createUser();
    const agent = await loginAs(user);

    const first = await agent.post('/api/v1/users/me/addresses').send(addressInput());
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({ isDefault: true, country: 'India', label: 'home' });

    const second = await agent.post('/api/v1/users/me/addresses').send(addressInput({ city: 'Mumbai', label: 'work' }));
    expect(second.body.data.isDefault).toBe(false);

    const third = await agent.post('/api/v1/users/me/addresses').send(addressInput({ city: 'Nagpur', isDefault: true }));
    expect(third.body.data.isDefault).toBe(true);
    expect(await Address.countDocuments({ user: user._id, isDefault: true })).toBe(1);

    const list = await agent.get('/api/v1/users/me/addresses');
    expect(list.body.data).toHaveLength(3);
    expect(list.body.data[0]._id).toBe(third.body.data._id);

    const setDefault = await agent.patch(`/api/v1/users/me/addresses/${second.body.data._id}/default`);
    expect(setDefault.status).toBe(200);
    expect(setDefault.body.data[0]._id).toBe(second.body.data._id);
    expect(setDefault.body.data.filter((a) => a.isDefault)).toHaveLength(1);

    const updated = await agent.patch(`/api/v1/users/me/addresses/${first.body.data._id}`).send({ landmark: 'Near park' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ landmark: 'Near park', city: 'Pune', country: 'India', isDefault: false });

    // Deleting the default promotes the most recently updated address (the one just edited).
    expect((await agent.delete(`/api/v1/users/me/addresses/${second.body.data._id}`)).status).toBe(200);
    const after = await Address.find({ user: user._id, isDefault: true }).lean();
    expect(after.map((a) => String(a._id))).toEqual([first.body.data._id]);

    expect((await agent.delete(`/api/v1/users/me/addresses/${second.body.data._id}`)).status).toBe(404);
    expect((await agent.patch('/api/v1/users/me/addresses/not-an-id').send({ city: 'X' })).status).toBe(422);
  });

  it('does not expose or modify other users’ addresses and enforces the limit', async () => {
    const owner = await createUser();
    const foreign = await createAddress(owner);
    const user = await createUser();
    const agent = await loginAs(user);

    expect((await agent.patch(`/api/v1/users/me/addresses/${foreign._id}`).send({ city: 'Goa' })).status).toBe(404);
    expect((await agent.delete(`/api/v1/users/me/addresses/${foreign._id}`)).status).toBe(404);

    await Address.insertMany(Array.from({ length: 10 }, () => ({ ...addressInput(), user: user._id })));
    const res = await agent.post('/api/v1/users/me/addresses').send(addressInput());
    expect(res.status).toBe(400);
  });
});

describe('users: stats & reviews', () => {
  it('aggregates order, wishlist and review stats', async () => {
    const user = await createUser();
    const { product, variants } = await createProduct();
    const [variant] = variants;
    await Order.create([
      orderDoc(user, product, variant, { paymentStatus: 'paid', status: 'delivered', pricing: { subtotal: 1000, total: 1180 } }),
      orderDoc(user, product, variant, { paymentStatus: 'paid', status: 'shipped', pricing: { subtotal: 500, total: 590.5 } }),
      orderDoc(user, product, variant, { paymentStatus: 'pending', status: 'pending' }),
      orderDoc(user, product, variant, { paymentStatus: 'failed', status: 'cancelled' }),
    ]);
    await Wishlist.create({ user: user._id, items: [{ product: product._id }, { product: (await createProduct()).product._id }] });
    await Review.create({ product: product._id, user: user._id, rating: 5, title: 'Great', comment: 'Really great product!', status: 'approved' });

    const agent = await loginAs(user);
    const stats = await agent.get('/api/v1/users/me/stats');
    expect(stats.status).toBe(200);
    expect(stats.body.data).toEqual({ orderCount: 4, totalSpent: 1770.5, wishlistCount: 2, reviewCount: 1, activeOrders: 2 });

    const reviews = await agent.get('/api/v1/users/me/reviews').query({ limit: 5 });
    expect(reviews.status).toBe(200);
    expect(reviews.body.data.pagination).toMatchObject({ total: 1, limit: 5 });
    expect(reviews.body.data.items[0].product).toMatchObject({ name: product.name, slug: product.slug, thumbnail: product.thumbnail });
  });

  it('returns zeros for a new user', async () => {
    const agent = await loginAs(await createUser());
    const stats = await agent.get('/api/v1/users/me/stats');
    expect(stats.body.data).toEqual({ orderCount: 0, totalSpent: 0, wishlistCount: 0, reviewCount: 0, activeOrders: 0 });
  });
});

describe('notifications & store', () => {
  it('lists, marks and deletes notifications', async () => {
    const user = await createUser();
    const agent = await loginAs(user);
    const { notificationService } = await import('../src/services/notification.service.js');
    const a = await notificationService.notify({ userId: user._id, type: 'system', title: 'A', message: 'First' });
    await notificationService.notify({ userId: user._id, type: 'system', title: 'B', message: 'Second' });

    const list = await agent.get('/api/v1/notifications').query({ unreadOnly: 'true' });
    expect(list.body.data.items).toHaveLength(2);
    expect(list.body.data.meta.unreadCount).toBe(2);

    const read = await agent.patch(`/api/v1/notifications/${a._id}/read`);
    expect(read.body.data.isRead).toBe(true);
    const all = await agent.patch('/api/v1/notifications/read-all');
    expect(all.body.data).toEqual({ updated: 1 });
    expect((await agent.delete(`/api/v1/notifications/${a._id}`)).status).toBe(200);
    expect((await agent.delete(`/api/v1/notifications/${a._id}`)).status).toBe(404);
  });

  it('serves public settings, newsletter and contact', async () => {
    const settings = await request(app).get('/api/v1/store/settings');
    expect(settings.status).toBe(200);
    expect(settings.body.data).toMatchObject({ currency: 'INR', razorpayEnabled: true });
    expect(settings.body.data.reservationTtlMinutes).toBeUndefined();

    for (let i = 0; i < 2; i += 1) {
      expect((await request(app).post('/api/v1/store/newsletter').send({ email: 'News@Example.com' })).status).toBe(200);
    }
    const contact = await request(app)
      .post('/api/v1/store/contact')
      .send({ name: 'Meera', email: 'meera@example.com', subject: 'Sizing', message: 'Do your shoes run small?' });
    expect(contact.status).toBe(201);

    const admin = await loginAs(await createUser({ role: 'ADMIN' }));
    const messages = await admin.get('/api/v1/admin/messages').query({ status: 'new' });
    expect(messages.body.data.items).toHaveLength(1);
    const patched = await admin.patch(`/api/v1/admin/messages/${messages.body.data.items[0]._id}`).send({ status: 'resolved' });
    expect(patched.body.data.status).toBe('resolved');

    const upd = await admin.patch('/api/v1/admin/settings').send({ shippingFee: 49, social: { instagram: 'https://instagram.com/bluemart' } });
    expect(upd.status).toBe(200);
    expect(upd.body.data.shippingFee).toBe(49);
    expect(upd.body.data.social).toMatchObject({ instagram: 'https://instagram.com/bluemart', facebook: 'https://facebook.com' });
    expect((await admin.patch('/api/v1/admin/settings').send({ returnWindowDays: 99 })).status).toBe(422);
    expect((await admin.get('/api/v1/admin/settings')).body.data.shippingFee).toBe(49);
  });
});
