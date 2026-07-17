# 03 — API Reference

This catalog lists the REST endpoints that **actually exist**, reconciled against the mounted routers in
`routes/api/index.js` and `routes/protectedRoutes.js` (see routing in [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md)).
All paths are prefixed with `/api` and rate-limited to **120 req/min/IP**. Data-model references are in
[`02-DATA-MODEL.md`](02-DATA-MODEL.md); DANA endpoints are detailed in [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md).

> **No Midtrans endpoint exists.** There is no `/hooks/midtrans` and no Midtrans webhook route anywhere.
> Payment callbacks are DANA-only (`/api/dana-notify-callback`).

## Auth conventions

- **JWT** is a `Bearer` token in the `Authorization` header, verified by `authMiddleware`.
- **Admin** endpoints additionally require `adminMiddleware` (`isAdmin` claim). See [`07-SECURITY-AND-AUTH.md`](07-SECURITY-AND-AUTH.md).
- "Public" below means no auth middleware is applied (some still require valid provider/booking data).

---

## 1. Auth — `/api/auth`

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/api/auth/register` | Public | `{ username, password(≥6) }` | 201 `{ message }`; 400 if exists |
| POST | `/api/auth/admin-register` | JWT | `{ username, password(≥6) }` | 201; registers an **admin** user |
| POST | `/api/auth/admin-login` | Public | `{ username, password }` | `{ token, message }`; 403 if not admin |
| POST | `/api/auth/` | Public | `{ username, password }` | `{ token, message }`; 401 bad creds, 404 no user |
| GET | `/api/auth/me` | JWT | — | `{ user: <decoded JWT>, message }` |

Validation (`register`/`admin-*`): `username` non-empty, `password` ≥ 6 chars (`express-validator`, 422 on fail).

### Admin user management — `/api/auth/users` (JWT + admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/users/` | List all users |
| POST | `/api/auth/users/register` | Create an admin user |
| GET | `/api/auth/users/:username` | Get one user |
| PUT | `/api/auth/users/:user_id` | Update username/password |
| DELETE | `/api/auth/users/:id` | Delete user |

---

## 2. Flight — `/api/flight`

| Method | Path | Auth | Request | Behavior |
|--------|------|------|---------|----------|
| GET | `/api/flight/airports` | Public | — | Provider airports; sorted (priority list), Redis-cached 24h |
| GET | `/api/flight/airlines` | Public | — | Provider airlines; Redis-cached 24h |
| GET | `/api/flight/search-airport/:query` | Public | path query | Local fuzzy airport search; Redis-cached 30d |
| POST | `/api/flight/search` | Public | `{ departure, arrival, departureDate, returnDate?, adult, child, infant }` | Provider search; Redis-cached 30m by composite key |
| POST | `/api/flight/book` | Public | provider booking payload (`passengers`, buyer…) | Calls provider `f:book`; on success persists a `FlightBooking` (+ transaction) via DAO; returns `{ rc, msg, data }`. Maps provider RC codes to Indonesian messages; errors are returned as **200** JSON to dodge CORS/Cloudflare blocks |
| GET | `/api/flight/book-info` | Public | — | All booking info from provider (`fetchBookingInfo()`) |
| GET | `/api/flight/book-info/:id` | Public | path id | Checks **local ferry DB first** (returns a flight-shaped adapter with ferry e-ticket base64 if PAID), else queries provider booking info |
| POST | `/api/flight/payment` **and** `/api/payment` | Public | `{ bookingCode }` | **Server derives amount** from `FlightBooking.totalSales` (never trusts client `nominal`); calls provider `f:payment`; on `rc:00` marks paid + issues, then emails e-ticket/invoice async. 404/422 on missing/invalid amount |
| GET | `/api/flight/payment` | Public | — | Static 404 |
| GET | `/api/flight/booking-data` | Public | — | `FlightBookingDAO.findAllBookings()` |
| DELETE | `/api/flight/booking-data/:id` | Public | — | Delete a flight booking by id |

### Flight bookings — `/api/flight/bookings` (⚠ dual-mount)
The flight sub-router mounts `flight-bookings` at `/api/flight/bookings` **without** auth; `protectedRoutes.js`
also mounts it at `/api/flight/bookings` **with** `authMiddleware`. Both register the same path — Express
resolves to the first matched router by registration order (`routes/index.js` tree is mounted before
`protectedRoutes`). This overlap is a latent inconsistency and should be resolved to a single intended mount.

Endpoints in this router (CRUD/query helpers on `FlightBooking`):
`POST /`, `GET /`, `GET /:id`, `GET /bookNo/:bookNo`, `GET /name/:name`, `GET /paymentStatus/:status`,
`GET /airlines/:airlines`, `GET /sortedByBookDate`, `GET /sortedByFlightDate`.
> Note: `POST /` calls `FlightBookingDAO.createBooking(passenger_name, amount, …)` with **positional args**,
> but the DAO expects a single object — this legacy handler will not create a valid record as written.
> `GET /airlines/:airlines` calls `findBookingsByAirlines`, which does not exist on the DAO (would 500).

---

## 3. Ferry — `/api/ferry`

Most ferry endpoints proxy the Sindo Ferry API via `routes/api/ferry/utils.js#makeRequest` and use the cached
agent token (`ensure-token` middleware or auto-fetch). See [`05-INTEGRATIONS.md`](05-INTEGRATIONS.md).

### Master data — `/api/ferry/master`
| Method | Path | Cache | Notes |
|--------|------|-------|-------|
| GET | `/sectors` | 1h | `GET /Agent/Booking/Sectors/Available` |
| GET | `/routes?searchString&sectorID&pageIndex&pageSize` | 24h | `GET /Agent/Master/Routes` |
| GET | `/countries?searchString&sort&pageIndex&pageSize` | (cached) | `GET /Agent/Master/Countries` |

### Trips — `/api/ferry/trips`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/search?embarkation&destination&tripdate` | Core API `GET /Trips/GetTripWeb`; 5-min cache; enriches with fallback price/vessel/seats |

### Booking — `/api/ferry/booking` (all require `ensure-token`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | **Unified multi-step booking adapter**: resolves route GUID + countries, fetches trip, inits Sindo booking, adds passengers, queries **live pricing** (fails 502 if unavailable — never trusts client price), upserts terminals, persists `FerryBooking` + transaction. Returns `{ bookingNo, id, data:{ totalPrice } }` |
| POST | `/:id/details` | Add a passenger to a Sindo booking |
| POST | `/submit` | Submit booking (`id`, `emailConfirmation` required) |
| GET | `/:id` | Local DB first, else Sindo `Bookings/:id` |
| GET | `/:id/pricing` | Sindo pricing for a booking |
| POST | `/transfer` | Initiate a booking transfer |
| GET | `/transfer/:id` | Transfer details |

### Orders — `/api/ferry/order`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/vouchers` | Agent voucher types (1h cache) |
| GET | `/vouchers/:id` | Voucher type detail |
| GET | `/:id/print` | Order printout |
| POST | `/:id/whatsapp` | Send voucher to WhatsApp/messenger |
| POST | `/:id/email` | Send voucher to email |

### Agent / Credit
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ferry/agent/agents` | Sindo agents list |
| GET | `/api/ferry/credit/` | Agent credit monitoring |

---

## 4. Car Rental — `/api/car-rental`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cars` | Public | List cars; filters `?type&rows&available` |
| GET | `/cars/:id` | Public | One car |
| POST | `/cars` | Public | Create car (`name,type,rows,pricePerDay` required) |
| PUT | `/cars/:id` | Public | Partial update |
| DELETE | `/cars/:id` | Public | Delete car + its photo files |
| GET | `/cars/:id/photos` | Public | List photos |
| POST | `/cars/:id/photos` | Public | Upload 1–10 images (`multipart`, field `photos`, ≤5MB, image-only) |
| DELETE | `/photos/:photoId` | Public | Delete a photo + file |
| POST | `/photos/bulk-delete` | Public | `{ ids: [] }` |
| GET | `/search` | Public | Available cars only |
| GET | `/types` | Public | Distinct car types |
| POST | `/rent` | Public | Rental request; `multipart` with `ktpImage`+`ktpSelfie` files; derives `totalSales = pricePerDay × rentalDays`; creates request + transaction |
| GET | `/rent` | Public | List all rental requests (admin-facing, but no middleware) |
| PATCH | `/rent/:id/status` | Public | Update rental status |

> Car-rental admin actions (`GET /rent`, `PATCH /rent/:id/status`, car CRUD) are **not** behind auth
> middleware in the router itself — access control is expected at the gateway/UI layer. Flagged in
> [`07-SECURITY-AND-AUTH.md`](07-SECURITY-AND-AUTH.md).

---

## 5. DANA — `/api/dana` and `/api/dana-notify-callback`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/dana/create-order` | Public | `{ bookingNo, payMethod }`, `payMethod ∈ {DANA,BNI,BRI,MANDIRI,CIMB,PANIN}`. Server-derived amount from the owning booking; returns `{ kind:'VA'\|'REDIRECT', vaNumber?, redirectUrl?, expiryTime, referenceNo, bookingNo }`. 400 bad method, 404 not found, 409 already paid, 422 no amount, 502 gateway error |
| POST | `/api/dana-notify-callback` | DANA-signed / queryPayment-gated | DANA **Finish Notify** webhook. Verifies signature (or falls back to `queryPayment`), checks paid amount vs stored total, runs idempotent fulfillment, emits `booking:update`. Acks `{ responseCode:"2005600" }` |

Full detail, signing model, and sequence diagrams: [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md).

---

## 6. History — `/api/history`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/history?email=…` | Public | Guest booking history by email (case-insensitive). Returns `{ flights[], ferries[], cars[] }` derived from transactions with the owning booking joined |

---

## 7. Admin — `/api/admin` (JWT + admin on the whole router)

`router.use(authMiddleware, adminMiddleware)` guards **all** admin routes.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/transactions` | All transactions with flight/ferry/car relations |
| PATCH | `/api/admin/transactions/:id/cancel` | Mark `CANCELLED`; **blocked (409) if ticket already issued** (except car rentals) |
| PATCH | `/api/admin/transactions/:id/refund` | Mark `REFUNDED`; same issued-ticket guard |
| GET | `/api/admin/logs` | Combined `server.log` (pruned to 30 days) + a synthesized transaction audit stream |
| GET | `/api/admin/stats` | Totals, revenue, active cars, 6-month chart, service distribution, MoM growth |
| GET | `/api/admin/health` | DB latency, CPU/mem/uptime |
| GET | `/api/admin/upcoming-schedules` | Paid flights/ferries + rental requests in the next 7 days |
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users/register` | Create admin user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |

### Server ops console — `/api/admin/server` (JWT + admin)
A privileged file/process console rooted at the TiketQ project directory.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/files?path=` | Directory listing (path-jailed to project root) |
| GET | `/file?path=` | Read a file |
| POST | `/file/save` | Write a file |
| POST | `/file/move` | Move/rename |
| DELETE | `/file?path=` | Delete file/dir |
| GET | `/health` | OS CPU/mem/disk/uptime |
| GET | `/pm2` | `pm2 jlist` |
| POST | `/execute` | Run an **allow-listed** command (`git-pull`, `npm-install`, `npm-build`, `pm2-*`, `prisma-*`, `git-clone`) **or** `action:"raw"` with an arbitrary `command` string |

> `POST /execute` with `action:"raw"` executes an arbitrary shell command in the project dir. This is an
> intentional remote-ops capability but a significant attack surface — analyzed in [`07-SECURITY-AND-AUTH.md`](07-SECURITY-AND-AUTH.md).

---

## 8. Health & Proxy

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Deep check: DB, Redis, flight API, ferry API, DANA config. Returns 200/500, status `ok`/`degraded`/`error` |
| POST | `/api/proxy/:route` | Public | Dev passthrough: forwards `req.body` to the flight provider (`utils/axios-request`). Bypasses IP whitelisting locally |
| GET | `/api/proxy/:route` | Public | Same via `req.query` |

---

## 9. Root / Misc

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Static 401 "resource restricted" |
| GET | `/api/` | Welcome JSON listing domains |
| GET | `/api-docs` | Swagger UI (from `swagger.yaml`) |
| static | `/public`, `/assets`, `/uploads` | Static file serving (1-year cache) |

**Error envelope** (from `middleware/error-handler.js`): `{ message, errors: [], error?: <stack in dev only> }`
with the HTTP status from `err.status` (default 500). 5xx messages are masked in production. See
[`07-SECURITY-AND-AUTH.md`](07-SECURITY-AND-AUTH.md).
