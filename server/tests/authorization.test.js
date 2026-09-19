import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Session, User } from '../src/models/index.js';
import { PASSWORD, app, createAdmin, createUser, loginAs } from './helpers.js';

describe('authorization', () => {
  it('returns 401 for unauthenticated admin requests', async () => {
    expect((await request(app).get('/api/v1/admin/dashboard')).status).toBe(401);
    expect((await request(app).get('/api/v1/admin/customers')).status).toBe(401);
  });

  it('returns 403 for regular users on admin routes', async () => {
    const agent = await loginAs(await createUser());
    expect((await agent.get('/api/v1/admin/dashboard')).status).toBe(403);
    expect((await agent.get('/api/v1/admin/customers')).status).toBe(403);
    expect((await agent.get('/api/v1/admin/settings')).status).toBe(403);
  });

  it('allows admins', async () => {
    const agent = await loginAs(await createAdmin());
    expect((await agent.get('/api/v1/admin/dashboard')).status).toBe(200);
    expect((await agent.get('/api/v1/admin/customers')).status).toBe(200);
  });

  it('admin/login rejects non-admin users with 403 and bad credentials with 401', async () => {
    const user = await createUser();
    const res = await request(app).post('/api/v1/auth/admin/login').send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.headers['set-cookie']).toBeUndefined();

    const admin = await createAdmin();
    const bad = await request(app).post('/api/v1/auth/admin/login').send({ email: admin.email, password: 'Wrong1234' });
    expect(bad.status).toBe(401);
  });
});

describe('admin customers', () => {
  it('lists customers with order stats and search', async () => {
    const admin = await createAdmin();
    await createUser({ name: 'Zara Khan', email: 'zara@example.com' });
    await createUser({ name: 'Arjun (test)', email: 'arjun@example.com' });
    const agent = await loginAs(admin);

    const all = await agent.get('/api/v1/admin/customers');
    expect(all.status).toBe(200);
    expect(all.body.data.items).toHaveLength(2); // admins are excluded
    expect(all.body.data.items[0]).toMatchObject({ orderCount: 0, totalSpent: 0, lastOrderAt: null });
    expect(all.body.data.items[0].password).toBeUndefined();

    const search = await agent.get('/api/v1/admin/customers').query({ q: 'n (te', sort: 'spent' });
    expect(search.body.data.items.map((c) => c.email)).toEqual(['arjun@example.com']);
    expect(search.body.data.pagination.total).toBe(1);
  });

  it('blocks a customer, revoking their sessions, and protects admins', async () => {
    const admin = await createAdmin();
    const other = await createAdmin();
    const customer = await createUser();
    const customerAgent = await loginAs(customer);
    const agent = await loginAs(admin);

    const res = await agent.patch(`/api/v1/admin/customers/${customer._id}/status`).send({ status: 'blocked' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('blocked');
    expect(await Session.countDocuments({ user: customer._id, revokedAt: null })).toBe(0);
    expect((await customerAgent.get('/api/v1/auth/me')).status).toBe(403);
    expect((await User.findById(customer._id).select('+tokenVersion')).tokenVersion).toBe(1);

    expect((await agent.patch(`/api/v1/admin/customers/${admin._id}/status`).send({ status: 'blocked' })).status).toBe(400);
    expect((await agent.patch(`/api/v1/admin/customers/${other._id}/status`).send({ status: 'blocked' })).status).toBe(403);

    const detail = await agent.get(`/api/v1/admin/customers/${customer._id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.stats).toEqual({ orderCount: 0, totalSpent: 0, avgOrderValue: 0, cancelledCount: 0 });

    const reactivate = await agent.patch(`/api/v1/admin/customers/${customer._id}/status`).send({ status: 'active' });
    expect(reactivate.body.data.status).toBe('active');
  });
});
