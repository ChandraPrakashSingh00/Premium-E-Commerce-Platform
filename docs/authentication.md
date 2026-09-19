# Authentication & Authorization

## Tokens

| Token | Lifetime | Storage | Contents |
| --- | --- | --- | --- |
| Access token (JWT, HS256) | `JWT_ACCESS_EXPIRES_IN` (15 min) | HTTP-only cookie `accessToken` (path `/`) | `sub` user id, `role`, `tv` token version, `aud: access` |
| Refresh token (JWT, HS256, separate secret) | `JWT_REFRESH_EXPIRES_DAYS` (7 days) | HTTP-only cookie `refreshToken` (path `/api/v1/auth`) | `sub`, `sid` session id, `fam` family id, `aud: refresh` |

Cookies are `HttpOnly`, `Secure` in production and `SameSite=None` in production (client and API are usually on different sites) / `Lax` in development. `COOKIE_DOMAIN` can scope them to a shared parent domain. JavaScript never sees a token.

Non-browser clients may send `Authorization: Bearer <accessToken>`.

## Sessions and rotation

- Every login creates a `Session` document holding **only `sha256(refreshToken)`**, the family id, user agent, IP and expiry (TTL index removes expired sessions).
- `POST /auth/refresh` verifies the JWT, looks up the session by hash and atomically marks it revoked (`replacedBy` → new session) before issuing a new pair in the same family.
- **Reuse detection:** presenting a refresh token whose session is already revoked (after a 10-second grace window) or missing revokes the whole family and returns 401 – a stolen token becomes useless as soon as either party uses it.
- **Multi-tab race:** if two tabs refresh simultaneously, the loser gets `401 REFRESH_RACE` without cookie clearing; the client simply replays its request with the cookies the winner already stored.
- `tokenVersion` on the user is embedded in access tokens. Password change/reset, "sign out of all devices" and admin blocking increment it, instantly invalidating all outstanding access tokens, and revoke all sessions.

## Flows

**Register** → password hashed with bcrypt (12 rounds) in a Mongoose pre-save hook → session issued → verification token (32 random bytes, stored as SHA-256, 24 h) emailed → welcome notification.

**Login** → constant-work comparison (a dummy hash is compared when the email is unknown) → blocked accounts get 403 → `lastLoginAt` updated → cookies set. `POST /auth/admin/login` additionally requires role `ADMIN`.

**Forgot / reset password** → always responds 200 (no account enumeration) → token (SHA-256 stored, 30 min) emailed → reset sets the new password, clears the token, bumps `tokenVersion` and revokes every session.

**Email verification** → `POST /auth/verify-email {token}`; `POST /auth/resend-verification` for signed-in users.

**Client bootstrap** → `GET /auth/me` on load. The Axios interceptor catches a 401, performs one single-flight `POST /auth/refresh`, and replays the request; if refresh fails the session store is cleared and private query caches are dropped.

## Authorization

- `authenticate` – requires a valid access token, loads the user, rejects blocked users and stale token versions.
- `optionalAuth` – attaches the user when present (guest cart preview, review "helpful" state).
- `authorize(...roles)` / `requireAdmin` – role checks. The whole `/api/v1/admin` router is mounted behind `requireAdmin`.
- Ownership is enforced in services (orders, addresses, reviews are always queried with `user: req.user.id`), so guessing another id yields 404.
- Frontend guards (`RequireAuth`, `RequireAdmin`, `GuestOnly`) only improve UX – the API is the security boundary.

## Password policy

8–128 characters with at least one upper-case letter, one lower-case letter and one digit (validated on both client and server). Password hashes are `select: false` and removed by the model's `toJSON` transform together with all token fields.
