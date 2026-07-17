# 05 — External Integrations

Grounded in `routes/api/ferry/utils.js`, `utils/node-cache.js`, `middleware/ensure-token.js`,
`utils/axios-request.js`, `services/apiService.js`, and `services/chatService.js`. DANA is covered separately
in [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md).

## 1. Sindo Ferry API

Two Axios clients (`routes/api/ferry/utils.js`), both 45s timeout:

| Client | Base URL env | Used for |
|--------|--------------|----------|
| `api` (default) | `FERRY_URL` | Agent endpoints (login, master data, bookings, orders) |
| `core` | `FERRY_CORE_URL` | Trip search (`/Trips/GetTripWeb`) |

### 1.1 Authentication (token caching)
- Bearer-token auth. The token is obtained by `POST {FERRY_URL}/agent/Agent/Login` with
  `FERRY_AGENT_CODE` / `FERRY_USERNAME` / `FERRY_PASSWORD`.
- Cached in-process with `node-cache` for `expires_in` (default **86400s / 24h**). Two nearly-identical
  fetchers exist: `utils/node-cache.js` (`getFerryToken`, pre-warmed at app boot in `app.js`) and
  `middleware/ensure-token.js` (per-request middleware that also caches for 24h). `makeRequest` auto-fetches a
  token via `getFerryToken()` when none is passed.
- 403 responses are surfaced as an IP-whitelisting hint; failures map to `error.status` 502 (response) / 504
  (no response) with `source:"FerryAPI"`.

### 1.2 Booking / pricing
The unified `POST /api/ferry/booking` adapter (see [`03-API-REFERENCE.md`](03-API-REFERENCE.md)) performs a
multi-call Sindo sequence: resolve route GUID (`/Agent/Master/Routes`) + countries (`/Agent/Master/Countries`),
fetch the trip (core `/Trips/GetTripWeb`), init the booking (`/Agent/Booking/Bookings`), add each passenger
(`/Agent/Booking/Bookings/{guid}/Details`), and query **authoritative pricing**
(`/Agent/Booking/Bookings/{guid}/Details/WithPricing`). If live pricing can't be obtained it returns **502** —
it never falls back to a client-supplied price (a security property; see [`07-SECURITY-AND-AUTH.md`](07-SECURITY-AND-AUTH.md)).
Voucher codes are fetched post-payment during fulfillment
(`/agent/Order/Orders/{bookingNo}/WithVoucherIssuance`, see [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md)).

### 1.3 Redis vs. route caching
Ferry master/trip data is cached in **`node-cache`** (in-process, `utils/ferryCache.js`), not Redis:
routes/countries 24h, sectors/vouchers 1h, trips 5min. Redis (`utils/redisClient.js`) is used by the **flight**
domain (search 30m, airports/airlines 24h, airport-search 30d) and for health checks. Redis connections use a
`reconnectStrategy` of `false` (no background retries); when Redis is down, caching is silently bypassed
(`getRedisClient()` returns `null` and callers proceed uncached).

## 2. Flight / Lion Air Provider

- Single provider reached through `utils/axios-request.js#makeRequest`, wrapped by `services/apiService.js`.
- Base URL `FLIGHT_API_URL` (e.g. `…/api.pesawat.php`), **HTTP Basic auth** built from `API_KEY:SECRET_KEY`.
  Requests are JSON-stringified command payloads with an `f` selector (`airports`, `airlines`, `search`,
  `book`, `payment`, `bookInfo`). 45s timeout; errors normalized to `status` 502/504 with `source:"FlightAPI"`.
- `apiService.fetchData` standardizes responses to `{ message, data }` and back-fills `rc`/`msg`.

> **Naming note:** prior docs reference `LION_AIR_API_KEY` / `SINDO_FERRY_API_KEY`. The **actual code** uses
> `FLIGHT_API_URL` + `API_KEY`/`SECRET_KEY` (flight) and `FERRY_URL`/`FERRY_CORE_URL` +
> `FERRY_AGENT_CODE`/`FERRY_USERNAME`/`FERRY_PASSWORD` (ferry). No `LION_AIR_API_KEY` or `SINDO_FERRY_API_KEY`
> is read anywhere. [`08-DEPLOYMENT.md`](08-DEPLOYMENT.md) lists the real vars.

### 2.1 Mock flight provider (`MOCK_FLIGHT_API`)
`utils/axios-request.js` has a built-in, **stateful in-memory mock** gated by `MOCK_FLIGHT_API === "true"`.
When enabled it intercepts every outbound flight call and returns simulated responses for `airports`,
`airlines`, `search`, `book`, `payment`, and `bookInfo`, keeping mock bookings in a `Map` (`mockBookings`) so
search → book → payment behave statefully with generated `MOCK…` booking codes. This lets the flight flow be
exercised end-to-end with no provider connectivity/IP-whitelisting. Default is `"false"`.

## 3. AI Chatbot (`services/chatService.js`)

- **Endpoint:** an OpenAI-compatible chat-completions API via the `openai` SDK, configured with
  `apiKey: SUMOPOD_API_KEY` and `baseURL: AI_BASE_URL` (**not** the standard `OPENAI_API_KEY`).
- **Model:** `process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite"` (default).
- **Transport:** Socket.io only — no REST endpoint. `chat:message` in; `chat:typing`, `chat:tool_result`,
  `chat:response_done`, `chat:error` out. See [`06-REALTIME-AND-WEBHOOKS.md`](06-REALTIME-AND-WEBHOOKS.md).
- **Loop:** the service runs a tool-calling loop — it sends the conversation + tool schemas, executes any
  requested tool, emits an intermediate `chat:tool_result` (typed payloads the frontend renders as cards), and
  feeds results back until the model produces a final answer.

### 3.1 The 9 tool definitions
| # | Tool | Purpose |
|---|------|---------|
| 1 | `search_flights` | Search flights on a date (assumes 1 adult; `highlight_preference` cheapest/earliest/latest/all) |
| 2 | `search_cheapest_flight_in_range` | Cheapest flight across a date range |
| 3 | `search_ferry_trips` | Ferry trips (Batam BTC ⇄ Singapore HFC) |
| 4 | `execute_flight_booking` | Create a real flight booking (requires collected passenger details + `searchId`) |
| 5 | `execute_ferry_booking` | Create a real ferry booking (requires passenger details incl. passport issue date) |
| 6 | `generate_dana_payment` | Create a DANA bank-VA payment for a booking; **amount taken from stored booking server-side**; `payMethod ∈ {BNI,BRI,MANDIRI,CIMB,PANIN}`, default BNI |
| 7 | `get_booking_info` | Look up a **single** booking by its booking code (renders a `booking_summary` card) |
| 8 | `get_booking_history` | Look up **all** bookings (flights/ferries/cars) for an email via `GET /api/history?email=`; the model summarizes the list in text |
| 9 | `show_customer_service` | Render the customer-service contact card |

> **Booking lookup:** two entry points — `get_booking_info` for one booking by code, and
> `get_booking_history` for the full list tied to an email address. The latter returns no card;
> the model summarizes the bookings and can then open any one by code.

`ChatMessage`-style typed `chat:tool_result` payloads include flight/ferry result lists and the customer
service card; the frontend renders each type accordingly.
