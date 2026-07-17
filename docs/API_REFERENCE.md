# Full API Reference — Requests & Responses

The definitive reference for every HTTP endpoint exposed by `tiketq-bosbiller`, derived by reading the actual route handler source files. For each endpoint, this document provides the HTTP method, full path, authentication requirement, exact request body shape, every possible response payload (success and error), and a detailed description of the business logic executed — including edge cases like the unified ferry/flight gateway, Redis caching behavior, and the multi-step Sindo Ferry booking adapter. Use this document when building integrations, writing frontend API calls, or debugging unexpected responses.

> **Base URL:** `https://api.tiketq.com` (production) / `http://localhost:3000` (development)  
> **Content-Type:** `application/json` for all requests unless noted  
> **Authentication:** Protected routes require `Authorization: Bearer <JWT>` header  

---

## Auth Domain (`/api/auth`)

### `POST /api/auth/` — User Login
Logs in a standard (non-admin) user. Validates credentials against the `users` table using `bcryptjs`. Returns a signed JWT on success.

**Request Body:**
```json
{
  "username": "string (required, non-empty)",
  "password": "string (required, min 6 chars)"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful. You are now authenticated."
}
```

**Response 404 (user not found):**
```json
{ "error": "User not found. Please check your credentials." }
```

**Response 401 (wrong password):**
```json
{ "error": "Invalid credentials. Please try again." }
```

---

### `POST /api/auth/admin-login` — Admin Login
Same as user login, but additionally checks that `user.isAdmin === true`. Used exclusively by `tiket-admin`.

**Request Body:** Same as `/api/auth/`

**Response 403 (not an admin):**
```json
{ "error": "Unauthorized access. You do not have admin privileges." }
```

**Response 200:** Same as standard login.

---

### `POST /api/auth/register` — User Registration
Registers a new user with `isAdmin: false`. Checks for duplicate username first.

**Request Body:**
```json
{
  "username": "string (required, unique)",
  "password": "string (required, min 6 chars)"
}
```

**Response 201:**
```json
{
  "message": "User registered successfully. Please login to continue."
}
```

**Response 400 (duplicate username):**
```json
{ "error": "Username already exists" }
```

---

### `GET /api/auth/me` — Get Current User
Requires `Authorization: Bearer <JWT>`. Decodes the JWT via `authMiddleware` and returns the user object attached to `req.user`.

**Response 200:**
```json
{
  "user": { "id": 1, "username": "admin", "isAdmin": true },
  "message": "User profile retrieved successfully."
}
```

---

## Flight Domain (`/api/flight`)

### `GET /api/flight/book-info/:id` — Get Booking Info (Unified Gateway)
This is the most important endpoint for the E-Ticket page. It serves as a **unified gateway** for both flight and ferry bookings. The frontend always hits this endpoint regardless of service type.

**Business Logic:**
1. First checks if `:id` matches a `FerryBooking.bookingNo` in the local database.
2. If found and `payment_status === true`, generates a Ferry E-Ticket PDF via `ferryPdfService` and encodes it as Base64.
3. If a ferry booking is found, returns a **flight-adapter-shaped** response (so the frontend can render it without a separate code path).
4. If no ferry booking found, proxies the request to the external flight provider API via `apiService.fetchBookingInfo()`.

**Request:** No body required. `:id` is the booking code.

**Response 200 (Ferry Booking — mapped to flight adapter schema):**
```json
{
  "rc": "00",
  "message": "Ferry booking found successfully",
  "data": {
    "bookingCode": "QLXUEO",
    "status": "ISSUED",
    "tiket_pdf": "<base64 encoded PDF string>",
    "serviceType": "FERRY",
    "flightdetail": [
      {
        "depart": "08:30",
        "origin": "BTC",
        "arrival": "09:30",
        "destination": "HFC",
        "originName": "Batam Centre",
        "destinationName": "HarbourFront Centre",
        "flightCode": "Sindo Ferry Express",
        "durationDetail": "1 Hour"
      }
    ],
    "passengers": {
      "adults": [
        {
          "title": "MR",
          "first_name": "John",
          "last_name": "Doe",
          "date_of_birth": "1990-01-01T00:00:00.000Z"
        }
      ],
      "children": [],
      "infants": []
    }
  }
}
```

**Response 200 (Flight Booking — proxied from provider):**  
Shape mirrors the provider API response. Key fields used by the frontend: `rc`, `data.bookingCode`, `data.status`, `data.tiket_pdf`, `data.flightdetail[]`, `data.passengers`.

---

## Ferry Domain (`/api/ferry`)

### `GET /api/ferry/trips/search` — Search Ferry Trips
Returns available Sindo Ferry schedules. Results are **Redis-cached** using key `trips:${embarkation}:${destination}:${tripdate}` for 5 minutes.

**Query Parameters:**
- `embarkation` — Origin terminal code (e.g., `BTC`)
- `destination` — Destination terminal code (e.g., `HFC`)
- `tripdate` — Date in `YYYYMMDD` format (e.g., `20260601`)

**Response 200:**
```json
{
  "rc": "00",
  "data": [
    {
      "tripID": "abc-123-guid",
      "vesselName": "Sindo Express 1",
      "departureTime": "08:30",
      "arrivalTime": "09:30",
      "availableSeats": 45,
      "price": 350000
    }
  ]
}
```

---

### `POST /api/ferry/booking` — Initialize Ferry Booking (Multi-Step Adapter)
**Requires JWT.** This is a complex, multi-step process that runs in `< 2s` using concurrency:

1. Concurrently fetches Sindo Route GUID list and Country list (both 24h cached).
2. Resolves the route GUID from `originTerminalCode` and `destinationTerminalCode`.
3. Fetches trip details from cache or Sindo API (5-min cache).
4. Calls Sindo Ferry's `init_booking` API.
5. Calls Sindo Ferry's `add_passengers` API for each passenger (concurrently via `Promise.all`).
6. Calls Sindo Ferry's `submit_booking` API to get the final `bookingNo`.
7. Saves the booking to the local database via `FerryBookingDAO`.
8. Returns a TiketQ-standardized response with the `bookingNo`.

**Request Body:**
```json
{
  "tripID": "sindo-trip-guid",
  "contactEmail": "john@example.com",
  "contactMobileNumber": "08123456789",
  "departureDate": "2026-06-01",
  "originTerminalCode": "BTC",
  "destinationTerminalCode": "HFC",
  "passengers": [
    {
      "title": "MR",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-01",
      "passportNumber": "A1234567",
      "passportExpiry": "2030-01-01",
      "issuingCountry": "Indonesia",
      "nationality": "Indonesia"
    }
  ]
}
```

**Response 200:**
```json
{
  "rc": "00",
  "message": "Ferry booking created successfully",
  "data": {
    "bookingNo": "QLXUEO",
    "totalPrice": 350000
  }
}
```

**Response 400 (invalid route):**
```json
{ "message": "Could not find a valid Sindo Ferry route from BTC to XYZ." }
```

**Response 404 (invalid tripID):**
```json
{ "message": "Could not find the trip abc-123 on Sindo Ferry." }
```

---

## Admin Domain (`/api/admin`)

> **All `/api/admin/*` routes require `authMiddleware` + `adminMiddleware`** — the domain-wide `router.use(authMiddleware, adminMiddleware)` is active (previously commented out). Every endpoint below needs a valid admin JWT.

### `GET /api/admin/transactions` — List All Transactions
Returns all transactions from the `transactions` table, including nested `flightBooking` (with passengers), `ferryBooking` (with passengers, origin, destination), and `carRentalRequest` (with car). Ordered by `createdAt DESC`.

**Response 200:**
```json
{
  "message": "Transactions fetched successfully",
  "data": [
    {
      "id": 1,
      "serviceType": "FLIGHT",
      "bookingCode": "ABCDEF",
      "payment_status": true,
      "status": "PAID",
      "totalSales": "750000",
      "email": "john@example.com",
      "createdAt": "2026-05-27T10:00:00.000Z",
      "flightBooking": { "bookingCode": "ABCDEF", "origin": "CGK", "destination": "DPS", "passengers": [] },
      "ferryBooking": null,
      "carRentalRequest": null
    }
  ]
}
```

---

### `PATCH /api/admin/transactions/:id/cancel` — Cancel Transaction
### `PATCH /api/admin/transactions/:id/refund` — Refund Transaction
Internal status change only — does **not** call DANA's live Cancel/Refund Order API (see `docs/DANA_INTEGRATION.md`). Blocked with `409` if the linked flight/ferry booking has `ticketIssued: true`; car rental transactions (`serviceType: "CAR_RENTAL"`) are always exempt from this check.

**Response 200:**
```json
{ "status": 200, "message": "Transaction marked as CANCELLED", "data": { "id": 23, "status": "CANCELLED", "...": "..." } }
```

**Response 409** (ticket already issued):
```json
{ "status": 409, "message": "Cannot cancel/refund — ticket has already been issued" }
```

**Response 404:**
```json
{ "status": 404, "message": "Transaction not found" }
```

---

### `GET /api/admin/stats` — Dashboard Statistics
Returns aggregated metrics calculated in real-time via Prisma queries.

**Response 200:**
```json
{
  "message": "Stats fetched successfully",
  "data": {
    "totalTransactions": 124,
    "successfulTransactions": 98,
    "totalRevenue": 45200000,
    "activeCars": 5,
    "growth": "+12.4%",
    "chartData": [{ "name": "Jan", "total": 5000000 }],
    "serviceDistribution": [{ "name": "FLIGHT", "value": 60, "color": "#4267B2" }]
  }
}
```

---

### `GET /api/admin/health` — System Health
Returns real-time CPU, memory, uptime, and database latency measured at request time.

**Response 200:**
```json
{
  "message": "Health status fetched",
  "data": {
    "status": "Online",
    "services": [
      { "name": "Database (PostgreSQL)", "status": "Healthy", "latency": "4ms" },
      { "name": "API Server", "status": "Healthy", "latency": "0ms" }
    ],
    "system": {
      "cpu": "18%",
      "memory": "3.2GB/8.0GB (40%)",
      "uptime": "2d 14h 33m",
      "memPercent": 40,
      "cpuPercent": 18
    }
  }
}
```

---

### `GET /api/admin/logs` — Application & Audit Logs
Reads from `server.log` (pruned to 30-day retention) and combines with a transaction audit stream (also 30-day).

**Response 200:**
```json
{
  "message": "Logs fetched successfully",
  "data": "=== SYSTEM BOOT & SERVER PROCESS LOGS ===\n...\n=== TRANSACTION EVENT AUDIT STREAM ===\n[2026-05-27 10:00:00] [AUDIT] [FLIGHT] Txn ABCDEF by john@example.com - Status: PAID - Gross: Rp 750.000"
}
```

---

### `GET /api/admin/upcoming-schedules` — Next 7 Days Schedule
Returns all paid flights, ferries, and pending/approved car rentals departing in the next 7 days. Sorted ascending by departure date.

**Response 200:**
```json
{
  "message": "Upcoming schedules fetched",
  "data": [
    {
      "id": "FLIGHT-42",
      "type": "FLIGHT",
      "productName": "Flight Ticket",
      "date": "2026-05-28",
      "customerName": "John Doe",
      "detail": "CGK ➔ DPS"
    },
    {
      "id": "FERRY-18",
      "type": "FERRY",
      "productName": "Ferry Ticket",
      "date": "2026-05-29",
      "customerName": "Jane Doe",
      "detail": "Batam Centre ➔ HarbourFront Centre"
    }
  ]
}
```

---

### `GET /api/admin/users` — List Admin Users
Requires `authMiddleware` + `adminMiddleware`. Returns all users from the `users` table.

**Response 200:**
```json
{
  "message": "Users fetched successfully",
  "data": [{ "id": 1, "username": "admin", "isAdmin": true, "createdAt": "..." }]
}
```

---

### `POST /api/admin/users/register` — Create Admin User
**Request Body:**
```json
{ "username": "newadmin", "password": "secure123" }
```

**Response 201:**
```json
{ "message": "Administrator created successfully", "data": { "id": 2, "username": "newadmin", "isAdmin": true } }
```

---

### `PUT /api/admin/users/:id` — Update User
**Request Body:** Any `User` fields to update (partial).

**Response 200:**
```json
{ "message": "User updated successfully", "data": { "id": 2, "username": "updated", "isAdmin": true } }
```

---

### `DELETE /api/admin/users/:id` — Delete User

**Response 200:**
```json
{ "message": "User deleted successfully" }
```

---

## Payment (DANA) — `/api/dana`

> **Payment is DANA-only.** Midtrans has been removed — there is no `POST /webhooks/midtrans` route and no Midtrans integration in source. See `docs/DANA_INTEGRATION.md`.

### `POST /api/dana/create-order` — Create a DANA Payment
Creates a native DANA payment for a booking. The amount is **always derived server-side** from the stored booking (the client never supplies an amount). Rejects bookings that are already paid.

**Request Body:**
```json
{
  "bookingNo": "string (required — ferry bookingNo or flight bookingCode)",
  "payMethod": "string (required) — one of: DANA | BNI | BRI | MANDIRI | CIMB | PANIN"
}
```
`DANA` = the DANA wallet/BALANCE method (hosted redirect). `BNI`/`BRI`/`MANDIRI`/`CIMB`/`PANIN` are bank virtual accounts. (`QRIS` and `BCA` were removed — QRIS needs a registered shop; BCA isn't enabled for this merchant.)

**Response 200 (VA method — bank transfer):**
```json
{
  "method": "BNI",
  "kind": "VA",
  "vaNumber": "88810012345678",
  "redirectUrl": null,
  "paymentCode": "88810012345678",
  "expiryTime": "2026-07-07T19:25:00+07:00",
  "referenceNo": "20260707...",
  "bookingNo": "QLXUEO"
}
```

**Response 200 (DANA wallet — hosted redirect):**
```json
{
  "method": "DANA",
  "kind": "REDIRECT",
  "vaNumber": null,
  "redirectUrl": "https://m.dana.id/...",
  "paymentCode": null,
  "expiryTime": "2026-07-07T19:25:00+07:00",
  "referenceNo": "20260707...",
  "bookingNo": "QLXUEO"
}
```

**Response 400:** `{ "message": "payMethod must be one of: DANA, BNI, BRI, MANDIRI, CIMB, PANIN" }` (or `bookingNo is required`)  
**Response 404:** `{ "message": "Booking not found" }`  
**Response 409:** `{ "message": "Booking is already paid" }`  
**Response 422:** `{ "message": "Booking has no valid amount to charge" }`  
**Response 502:** `{ "message": "Failed to create DANA payment", "code": "...", "detail": "..." }` — DANA rejected the order, or `{ "message": "DANA payment gateway is temporarily unavailable. Please try again." }` on a gateway outage.

---

### `POST /api/dana-notify-callback` — DANA Finish Notify Webhook
Called by DANA after a payment attempt completes (registered as the merchant's "Finish Payment URL" in the DANA dashboard). When a DANA public key is configured, verified against DANA's SNAP signature (`dana-node/webhook/v1`'s `WebhookParser`) — requests with a missing/invalid `X-SIGNATURE` get `401`. When no public key is configured (`DANA_WEBHOOK_PUBLIC_KEY` unset), the body is treated as an untrusted hint and every status change is gated on a signed `queryPayment` confirmation to DANA. See `docs/DANA_INTEGRATION.md` for the full integration writeup.

**Body sent by DANA** (`latestTransactionStatus`: `"00"` = success, `"05"` = cancelled/expired):
```json
{
  "originalPartnerReferenceNo": "<our bookingCode/bookingNo>",
  "originalReferenceNo": "20260707...",
  "merchantId": "216620080012019918983",
  "amount": { "value": "10000.00", "currency": "IDR" },
  "latestTransactionStatus": "00",
  "createdTime": "2026-07-07T19:00:00+07:00",
  "finishedTime": "2026-07-07T19:00:01+07:00"
}
```

**Business Logic:**
- `latestTransactionStatus: "00"` → verifies the paid `amount.value` matches the stored booking's `totalSales` (when a booking exists), then fulfills the linked FerryBooking/FlightBooking (`fulfillFerryBooking`/`fulfillFlightBooking` in `services/bookingFulfillment.js` — mark PAID, issue ticket/voucher, email) and emits `booking:update`. A mismatched amount is rejected with `500`. Fulfillment is idempotent.
- `latestTransactionStatus: "05"` → acknowledged only, no DB write (booking was never paid).
- In sandbox only, `amount.value === "11012.00"` triggers DANA's own mandatory "partner simulates an internal server error" compliance scenario — responds `5005601`/500 instead of processing.

**Response 200:**
```json
{ "responseCode": "2005600", "responseMessage": "Successful" }
```

**Response 500** (processing error, or the sandbox-only simulated-error scenario above):
```json
{ "responseCode": "5005601", "responseMessage": "Internal Server Error" }
```

**Response 401** (invalid/missing signature):
```json
{ "message": "Unauthorized. Invalid Signature" }
```
