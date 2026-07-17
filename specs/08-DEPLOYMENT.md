# 08 — Deployment & Operations

Grounded in `package.json`, `bin/www`, `app.js`, `scripts/dana-preflight.js`, `.env` / `.env.example`, and
`prisma/`. Cross-references: architecture in [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md), DANA config in
[`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md), integration vars in [`05-INTEGRATIONS.md`](05-INTEGRATIONS.md).

## 1. Runtime & Ports

- Node.js / Express app served by `bin/www` over plain HTTP; TLS/reverse-proxy (Nginx) is expected in front.
- **Port:** `process.env.PORT || "3001"`. The repo `.env` sets `PORT=3001`, so the service listens on **3001**
  by default.
  > Discrepancy: the root `CLAUDE.md` describes bosbiller as "port 3000". The **code and `.env` say 3001**;
  > treat 3001 as authoritative and set `PORT` explicitly per environment.
- Socket.io shares the same HTTP server (initialized in `bin/www`).

## 2. NPM Scripts

```json
"scripts": {
  "prestart": "node scripts/dana-preflight.js",
  "start":    "node ./bin/www"
}
```

- `npm start` runs `prestart` first (DANA preflight, §5) then boots the server.
- **No `build`, `lint`, `dev`, or `test` script** — there is no test runner and no compile step (plain
  CommonJS). (`npm-build`/`prisma-*` in the admin ops console refer to *other* subprojects' builds, not this
  one.)

## 3. Prisma Setup

```bash
npm install
npx prisma generate          # regenerate client after install / schema change
npx prisma migrate deploy    # apply migrations in prisma/migrations (prod)
# or: npx prisma db push      # sync schema without a migration (dev)
npm start
```

- `prisma generate` **must** run after install and after any `schema.prisma` change (the generator uses the
  default client output). See [`02-DATA-MODEL.md`](02-DATA-MODEL.md) for the model set and migration list.
- App boot (`app.js`) auto-runs: `connectDB()` (exits process on failure), `seedAdmin()` (creates the default
  admin), Redis client init (non-fatal on failure), and Sindo Ferry token pre-warm (non-fatal).

## 4. Environment Variables

### 4.1 Required
| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | PostgreSQL connection (Prisma datasource) |
| `JWT_SECRET` | HS256 signing/verification of auth tokens |
| `FLIGHT_API_URL` | Flight provider base URL |
| `API_KEY`, `SECRET_KEY` | Flight provider HTTP Basic credentials |
| `FERRY_URL`, `FERRY_CORE_URL` | Sindo Ferry agent + core base URLs |
| `FERRY_AGENT_CODE`, `FERRY_USERNAME`, `FERRY_PASSWORD` | Sindo Ferry login credentials |
| `DANA_MERCHANT_ID`, `DANA_CLIENT_ID`, `DANA_CLIENT_SECRET`, `DANA_PRIVATE_KEY`, `DANA_API_BASE_URL` | DANA SNAP (all five checked by preflight) |
| `SUMOPOD_API_KEY`, `AI_BASE_URL` | AI chatbot (OpenAI-compatible endpoint) |
| `DEFAULT_USER`, `DEFAULT_PASSWORD` | Seed admin credentials |

### 4.2 Optional / defaulted
| Var | Default / behavior |
|-----|--------------------|
| `PORT` | `3001` |
| `NODE_ENV` | unset → treated as production for error hygiene (see [`07-SECURITY-AND-AUTH.md`](07-SECURITY-AND-AUTH.md)) |
| `REDIS_URL` | `redis://localhost:6379`; if unreachable, caching is silently bypassed |
| `AI_MODEL` | `gemini/gemini-2.5-flash-lite` |
| `MOCK_FLIGHT_API` | `false`; `"true"` enables the in-memory flight mock (see [`05-INTEGRATIONS.md`](05-INTEGRATIONS.md)) |
| `DANA_ENV` | `sandbox` (else production; enables sandbox-only UAT hooks) |
| `DANA_ORIGIN` | `https://tiketq.com` |
| `DANA_NOTIFY_URL` | falls back to `DANA_ORIGIN` for the notify `urlParams` |
| `DANA_STORE_ID` | when set, sends `externalStoreId`; required for QRIS, unregistered value → `4045408 Invalid Merchant` |
| `DANA_WEBHOOK_PUBLIC_KEY` / `DANA_WEBHOOK_PUBLIC_KEY_PATH` | when unset, notify falls back to `queryPayment` confirmation instead of signature verification |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | transactional email (`nodemailer`) |
| `API_BASE_URL` | overrides the base URL used to build uploaded car/KTP image URLs |

### 4.3 Present in `.env` but NOT read by code
| Var | Status |
|-----|--------|
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` | **Dead** — Midtrans was removed; no code reads these (see [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md)). Safe to delete |
| `DANA_PUBLIC_KEY` | Present in `.env`; the webhook reads `DANA_WEBHOOK_PUBLIC_KEY`/`_PATH`, not this name |
| `ENVIRONMENT`, `DB_NAME`, `USER_NAME`/`PASS_WORD`, `SECRET_KEY` (Mongo-era leftovers) | Legacy/unused by the active flows |

> There are **no** `SINDO_FERRY_API_KEY` or `LION_AIR_API_KEY` vars in the code despite prior docs mentioning
> them; the real integration vars are the flight/ferry ones above (see [`05-INTEGRATIONS.md`](05-INTEGRATIONS.md)).

## 5. DANA Preflight (`prestart`)

`scripts/dana-preflight.js` runs before every `npm start` and **fails fast, offline**:

- Requires `DANA_MERCHANT_ID`, `DANA_CLIENT_ID`, `DANA_CLIENT_SECRET`, `DANA_PRIVATE_KEY`, `DANA_API_BASE_URL`;
  exits non-zero listing any missing var.
- Verifies `DANA_PRIVATE_KEY` can produce a non-empty SNAP signature (`generateSnapB2BScenarioSignature`);
  exits non-zero if signing fails.
- In non-sandbox mode, **warns** (non-fatal) if no DANA webhook public key is set, noting the notify webhook
  will fall back to `queryPayment` confirmation.
- No network calls. For a live end-to-end sandbox check, run `node scripts/dana-uat-test.js` manually
  (other DANA UAT scripts: `dana-notify-uat-test.js`, `dana-cancel-refund-uat-test.js`).

## 6. Operational Notes

- **Health:** `GET /api/health` (deep: DB/Redis/flight/ferry/DANA) and `GET /api/admin/health` /
  `GET /api/admin/server/health` (system metrics, admin-only). See [`03-API-REFERENCE.md`](03-API-REFERENCE.md).
- **Process management:** the admin server console shells out to `pm2` (`pm2 jlist`, `pm2 restart/stop/...`),
  implying PM2 as the intended process manager in deployment.
- **Static/uploads:** `/uploads` is served from disk and is where car photos and KTP images are written —
  ensure the directory is persisted and backed up (or externalized) across deploys.
- **Logs:** `GET /api/admin/logs` reads and 30-day-prunes a `server.log` at the project root — configure the
  process manager to write process output there for that view to populate.
