# Full API Reference — Requests & Responses

**AI Context Note:** This document is derived from reading the actual route handler source files. Every request body, response shape, and business logic note is sourced directly from the code. Use this as the single source of truth when building integrations or new features.

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

> All `/api/admin/users` sub-routes require `authMiddleware` + `adminMiddleware`.

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

## Webhook (`/webhooks`)

### `POST /webhooks/midtrans` — Midtrans Payment Notification
Called asynchronously by Midtrans after a payment is captured/settled. **No authentication required** (secured via Midtrans signature verification).

**Body sent by Midtrans:**
```json
{
  "order_id": "ORDER-ABCDEF-1716800000",
  "transaction_status": "settlement",
  "gross_amount": "750000.00"
}
```

**Business Logic:**
- If `order_id.startsWith("ferry-")`: updates `FerryBooking` to PAID, fetches voucher codes from Sindo API, generates PDF, sends email.
- Otherwise (flight): Issues ticket to provider, updates `FlightBooking` to PAID, generates PDF, sends email.
- On any success path, emits `booking:update` Socket.io event: `{ bookingNo: string }`

**Response 200:**
```json
{ "status": "OK" }
```
