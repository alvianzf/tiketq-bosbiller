# 07 — Security & Authentication

Factual current posture, grounded in `db/dao/UserDAO.js`, `middleware/*`, `routes/api/admin/*`,
`routes/api/flight/payment/index.js`, `routes/api/ferry/booking/index.js`, and
`routes/api/dana-notify-callback.js`.

## 1. Authentication (JWT + bcrypt)

- **Password hashing:** `bcryptjs` with a generated salt of cost **10** (`UserDAO.register`, `updateUser`,
  `seedAdmin`). Plaintext passwords are never stored; `findByUsername` uses a `select` that excludes
  `password`, and only `findByUsernameWithPassword` returns the hash (login path).
- **Token:** `jsonwebtoken.sign({ id, username, isAdmin }, JWT_SECRET, { expiresIn: "24h" })` — **HS256**
  (symmetric, the `jsonwebtoken` default), 24-hour expiry.
- **Verification:** `authMiddleware` requires an `Authorization: Bearer <token>` header, strips the `Bearer`
  prefix, `jwt.verify`s against `JWT_SECRET`, and attaches the decoded claims to `req.user`. Distinct 401s for
  missing header, missing token, expired token, and invalid token.
- **Login flows:** `POST /api/auth/` (user), `POST /api/auth/admin-login` (rejects non-admins with 403). Bad
  credentials → 401; unknown user → 404.

## 2. Authorization (admin middleware — ENABLED)

`adminMiddleware` requires `req.user.isAdmin` (403 otherwise) and must run after `authMiddleware`.

- **`/api/admin` is fully guarded:** `routes/api/admin/index.js` begins with
  `router.use(authMiddleware, adminMiddleware)`, so **every** admin route — transactions, stats, health, logs,
  users, and the `/server` ops console (which *also* re-applies both) — is admin-only. This is the current,
  enabled state.
- **`/api/auth/users`** is likewise guarded by `router.use(authMiddleware, adminMiddleware)`.

### 2.1 Gaps to be aware of (factual)
- **Car-rental admin actions are unauthenticated at the router:** `GET /api/car-rental/rent`,
  `PATCH /api/car-rental/rent/:id/status`, and car/photo CRUD have **no** auth middleware. Access control is
  presently only at the gateway/UI. This should move behind `authMiddleware + adminMiddleware` for production.
- **Flight payment is public:** `POST /api/payment` and `POST /api/flight/payment` are not authed. The risk is
  bounded by server-side amount derivation (§4), but the endpoint can be invoked by anyone with a booking code.
- **`/api/flight/bookings` dual mount:** one mount is authed (`protectedRoutes.js`), one is not (flight
  sub-router). The effective guard depends on route registration order — an inconsistency to resolve
  (see [`03-API-REFERENCE.md`](03-API-REFERENCE.md)).
- **`POST /api/admin/server/execute` (`action:"raw"`)** runs an arbitrary shell command in the project
  directory. It is admin-gated, but it is a full RCE-by-design surface: compromise of a single admin JWT yields
  shell access. Consider removing `raw`, adding audit logging, and constraining to the allow-list only.

## 3. DAO discipline

All transactional DB access flows through `db/dao/*` singletons (see [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md)).
Controllers do not hand-roll Prisma queries for the booking/payment/user paths, which keeps invariants (atomic
payment claims, cascade relations) in one place. **Documented exceptions** are the admin analytics/ops routes,
`/api/history`, and `/api/health`, which use the shared Prisma client directly for aggregation/liveness that
has no DAO method. These are read/aggregate paths; the money paths stay DAO-only.

## 4. Server-side price derivation (anti-tampering)

The system does **not** trust client-supplied prices on any paid path:

- **Flight payment** (`routes/api/flight/payment/index.js`): ignores any client `nominal`, loads the booking by
  code, and charges `Number(existing.totalSales)` — 404 if missing, 422 if ≤ 0.
- **DANA create-order** (`routes/api/dana/index.js`): derives the amount from the owning booking's `totalSales`
  server-side; the client only names the `bookingNo` and `payMethod`.
- **Ferry booking** (`routes/api/ferry/booking/index.js`): prices from **live Sindo pricing**
  (`…/Details/WithPricing`) and **fails 502 rather than fall back to `req.body.price`** — an underpriced paid
  booking is not possible.
- **DANA notify** (`routes/api/dana-notify-callback.js`): before fulfilling, verifies the paid amount matches
  the stored `totalSales` (`Math.round` compare); a mismatch is rejected with 500 and no ticket is issued.

## 5. Payment-callback integrity

- **Signature verification** of the DANA notify via `WebhookParser` (DANA public key). When the public key is
  unset, the handler treats the body as an untrusted hint and independently confirms status with a signed
  `queryPayment` before changing any state (see [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md) §4).
- **Idempotency** via atomic `claimForPayment` (`updateMany` guarded on `payment_status:false`) prevents
  duplicate settlement/double issuance on webhook redelivery.

## 6. Error hygiene (no stack-trace leakage in prod)

`middleware/error-handler.js` gates verbosity on an **explicit** `NODE_ENV === "development"`:

```js
const isDev = process.env.NODE_ENV === "development";
res.json({
  message: status >= 500 && !isDev ? "Internal server error" : err.message,
  errors: err.errors || [],
  ...(isDev ? { error: err.stack } : {}),
});
```

- In production (any `NODE_ENV` other than `"development"`, including **unset**), 5xx messages are masked to
  `"Internal server error"` and the stack trace is **omitted**. The explicit check avoids Express's
  `app.get("env")` default of `"development"` that would otherwise leak stacks when `NODE_ENV` is unset.
- Stacks are still `console.error`'d server-side for diagnostics.

## 7. Other controls

- **Rate limiting:** all `/api/*` traffic is capped at **120 req/min/IP** (in-memory `node-cache`,
  `middleware/rate-limiter.js`), returning 429 with `X-RateLimit-*` headers. In-memory, so it is per-process
  and resets on restart / does not span multiple instances.
- **CORS:** in-process CORS accepts only `localhost`/`127.0.0.1` (and no-origin); production CORS is delegated
  to Nginx. Same policy for Socket.io.
- **Upload constraints:** car/KTP uploads are image-only, ≤ 5 MB, disk-stored (`multer`).
- **Admin seed:** `seedAdmin` creates a `DEFAULT_USER`/`DEFAULT_PASSWORD` admin at boot if absent — these
  credentials must be strong and rotated; a weak default is a standing risk.
- **Secrets:** JWT/DANA/provider secrets come from env (`.env`); the DANA private key must sign at preflight
  (see [`08-DEPLOYMENT.md`](08-DEPLOYMENT.md)).
