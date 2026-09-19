import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Notification, Session, User } from '../src/models/index.js';
import { authService } from '../src/services/auth.service.js';
import { PASSWORD, app, createUser, loginAs } from './helpers.js';

const API = '/api/v1/auth';
const NEW_PASSWORD = 'NewPassword456';

/** Extracts a cookie value from a supertest response ('' when cleared, undefined when absent). */
function cookieValue(res, name) {
  const header = (res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`));
  return header === undefined ? undefined : decodeURIComponent(header.split(';')[0].slice(name.length + 1));
}

const register = (agent, overrides = {}) =>
  agent.post(`${API}/register`).send({ name: 'Riya Sharma', email: 'riya@example.com', password: PASSWORD, ...overrides });

describe('auth: register', () => {
  it('creates the account, sets cookies, hides secrets and sends welcome notification', async () => {
    const res = await register(request(app));
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Riya Sharma', email: 'riya@example.com', role: 'USER', isEmailVerified: false });
    for (const key of ['password', 'tokenVersion', 'emailVerificationToken', 'passwordResetToken']) {
      expect(res.body.data.user).not.toHaveProperty(key);
    }
    expect(cookieValue(res, 'accessToken')).toBeTruthy();
    expect(cookieValue(res, 'refreshToken')).toBeTruthy();
    expect(res.headers['set-cookie'].join(';')).toMatch(/HttpOnly/i);

    const user = await User.findOne({ email: 'riya@example.com' }).select('+emailVerificationToken +emailVerificationExpires');
    expect(user.emailVerificationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now() + 23 * 3600 * 1000);
    expect(await Notification.countDocuments({ user: user._id, type: 'welcome' })).toBe(1);
    expect(await Session.countDocuments({ user: user._id })).toBe(1);
  });

  it('rejects a duplicate email with 409', async () => {
    await createUser({ email: 'dup@example.com' });
    const res = await register(request(app), { email: 'DUP@example.com' });
    expect(res.status).toBe(409);
  });

  it('rejects a weak password with 422', async () => {
    const res = await register(request(app), { password: 'weakpass' });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.field === 'body.password')).toBe(true);
  });
});

describe('auth: login / me / logout', () => {
  it('logs in with valid credentials and updates lastLoginAt', async () => {
    const user = await createUser();
    const agent = request.agent(app);
    const res = await agent.post(`${API}/login`).send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.password).toBeUndefined();
    expect((await User.findById(user._id)).lastLoginAt).toBeInstanceOf(Date);

    const me = await agent.get(`${API}/me`);
    expect(me.status).toBe(200);
    expect(me.body.data.user._id).toBe(String(user._id));
  });

  it('returns the same generic 401 for wrong password and unknown email', async () => {
    const user = await createUser();
    const wrong = await request(app).post(`${API}/login`).send({ email: user.email, password: 'WrongPass123' });
    const unknown = await request(app).post(`${API}/login`).send({ email: 'nobody@example.com', password: 'WrongPass123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('blocks suspended users with 403', async () => {
    const user = await createUser({ status: 'blocked' });
    const res = await request(app).post(`${API}/login`).send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(403);
  });

  it('requires authentication for /me', async () => {
    const res = await request(app).get(`${API}/me`);
    expect(res.status).toBe(401);
  });

  it('logout clears cookies and revokes the session', async () => {
    const user = await createUser();
    const agent = await loginAs(user);
    const res = await agent.post(`${API}/logout`);
    expect(res.status).toBe(200);
    expect(cookieValue(res, 'accessToken')).toBe('');
    expect(cookieValue(res, 'refreshToken')).toBe('');
    expect(await Session.countDocuments({ user: user._id, revokedAt: null })).toBe(0);
    expect((await agent.get(`${API}/me`)).status).toBe(401);
  });

  it('logout-all invalidates existing access tokens and sessions', async () => {
    const user = await createUser();
    const login = await request(app).post(`${API}/login`).send({ email: user.email, password: PASSWORD });
    const access = cookieValue(login, 'accessToken');
    const agent = await loginAs(user);

    expect((await agent.post(`${API}/logout-all`)).status).toBe(200);
    expect((await request(app).get(`${API}/me`).set('Authorization', `Bearer ${access}`)).status).toBe(401);
    expect(await Session.countDocuments({ user: user._id, revokedAt: null })).toBe(0);
  });
});

describe('auth: refresh rotation', () => {
  it('rotates tokens and revokes the family when an old token is reused', async () => {
    const user = await createUser();
    const login = await request(app).post(`${API}/login`).send({ email: user.email, password: PASSWORD });
    const original = cookieValue(login, 'refreshToken');

    const first = await request(app).post(`${API}/refresh`).set('Cookie', `refreshToken=${original}`);
    expect(first.status).toBe(200);
    expect(first.body.data.user.email).toBe(user.email);
    const rotated = cookieValue(first, 'refreshToken');
    expect(rotated).toBeTruthy();
    expect(rotated).not.toBe(original);
    expect(cookieValue(first, 'accessToken')).toBeTruthy();

    const old = await Session.findOne({ user: user._id, revokedAt: { $ne: null } });
    expect(old.replacedBy).toBeTruthy();

    // Within the grace window a replay is a benign multi-tab race: no revocation.
    const race = await request(app).post(`${API}/refresh`).set('Cookie', `refreshToken=${original}`);
    expect(race.status).toBe(401);
    expect(race.body.code).toBe('REFRESH_RACE');
    expect(race.headers['set-cookie']).toBeUndefined();
    expect(await Session.countDocuments({ user: user._id, revokedAt: null })).toBe(1);

    // After the grace window, replaying the rotated-out token is treated as theft.
    await Session.updateOne({ _id: old._id }, { $set: { revokedAt: new Date(Date.now() - 60_000) } });
    const reuse = await request(app).post(`${API}/refresh`).set('Cookie', `refreshToken=${original}`);
    expect(reuse.status).toBe(401);
    expect(await Session.countDocuments({ user: user._id, revokedAt: null })).toBe(0);

    // ...and the legitimate latest token is now dead too.
    const latest = await request(app).post(`${API}/refresh`).set('Cookie', `refreshToken=${rotated}`);
    expect(latest.status).toBe(401);
  });

  it('rejects missing or forged refresh tokens', async () => {
    expect((await request(app).post(`${API}/refresh`)).status).toBe(401);
    expect((await request(app).post(`${API}/refresh`).set('Cookie', 'refreshToken=not-a-jwt')).status).toBe(401);
  });
});

describe('auth: password reset & email verification', () => {
  it('forgot-password always returns 200', async () => {
    const res = await request(app).post(`${API}/forgot-password`).send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    const user = await createUser();
    expect((await request(app).post(`${API}/forgot-password`).send({ email: user.email })).status).toBe(200);
    const stored = await User.findById(user._id).select('+passwordResetToken +passwordResetExpires');
    expect(stored.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.passwordResetExpires.getTime()).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000);
  });

  it('resets the password with a valid token and revokes sessions', async () => {
    const user = await createUser();
    const login = await request(app).post(`${API}/login`).send({ email: user.email, password: PASSWORD });
    const refresh = cookieValue(login, 'refreshToken');
    const access = cookieValue(login, 'accessToken');

    const token = await authService.requestPasswordReset(user.email);
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const weak = await request(app).post(`${API}/reset-password/${token}`).send({ password: 'short' });
    expect(weak.status).toBe(422);

    const res = await request(app).post(`${API}/reset-password/${token}`).send({ password: NEW_PASSWORD });
    expect(res.status).toBe(200);

    // Token is single-use.
    expect((await request(app).post(`${API}/reset-password/${token}`).send({ password: NEW_PASSWORD })).status).toBe(400);
    expect((await request(app).post(`${API}/login`).send({ email: user.email, password: PASSWORD })).status).toBe(401);
    expect((await request(app).post(`${API}/login`).send({ email: user.email, password: NEW_PASSWORD })).status).toBe(200);
    expect((await request(app).post(`${API}/refresh`).set('Cookie', `refreshToken=${refresh}`)).status).toBe(401);
    expect((await request(app).get(`${API}/me`).set('Authorization', `Bearer ${access}`)).status).toBe(401);
  });

  it('rejects an expired reset token', async () => {
    const user = await createUser();
    const token = await authService.requestPasswordReset(user.email);
    await User.updateOne({ _id: user._id }, { $set: { passwordResetExpires: new Date(Date.now() - 1000) } });
    const res = await request(app).post(`${API}/reset-password/${token}`).send({ password: NEW_PASSWORD });
    expect(res.status).toBe(400);
  });

  it('verifies the email with a token and supports resend', async () => {
    const agent = request.agent(app);
    const reg = await register(agent);
    const userId = reg.body.data.user._id;

    expect((await agent.post(`${API}/resend-verification`)).status).toBe(200);
    const token = await authService.resendVerification(userId);

    expect((await request(app).post(`${API}/verify-email`).send({ token: 'f'.repeat(64) })).status).toBe(400);
    const res = await request(app).post(`${API}/verify-email`).send({ token });
    expect(res.status).toBe(200);
    expect(res.body.data.user.isEmailVerified).toBe(true);
    expect(res.body.data.user.emailVerificationToken).toBeUndefined();

    // Already verified.
    expect((await agent.post(`${API}/resend-verification`)).status).toBe(400);
  });
});

describe('auth: change password', () => {
  it('requires the current password, invalidates old tokens and issues fresh cookies', async () => {
    const user = await createUser();
    const agent = request.agent(app);
    const login = await agent.post(`${API}/login`).send({ email: user.email, password: PASSWORD });
    const oldAccess = cookieValue(login, 'accessToken');
    const oldRefresh = cookieValue(login, 'refreshToken');

    const wrong = await agent.patch(`${API}/change-password`).send({ currentPassword: 'Nope12345', newPassword: NEW_PASSWORD });
    expect(wrong.status).toBe(400);

    const res = await agent.patch(`${API}/change-password`).send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(200);
    expect(cookieValue(res, 'accessToken')).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined();

    expect((await request(app).get(`${API}/me`).set('Authorization', `Bearer ${oldAccess}`)).status).toBe(401);
    expect((await request(app).post(`${API}/refresh`).set('Cookie', `refreshToken=${oldRefresh}`)).status).toBe(401);
    // The agent holds the freshly issued cookies.
    expect((await agent.get(`${API}/me`)).status).toBe(200);
    expect((await agent.post(`${API}/refresh`)).status).toBe(200);
  });
});
