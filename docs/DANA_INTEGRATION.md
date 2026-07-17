# Dana Payment Integration

**DANA is TiketQ's only payment gateway** — Midtrans has been fully removed (no `midtrans-client` in source, no `POST /webhooks/midtrans` route). Payments use DANA's SNAP Payment Gateway API. This document is the reference for the DANA integration; see `WEBHOOKS_AND_SOCKETS.md` for the Finish Notify webhook and Socket.io emit.

> **Status:** Sandbox integration built and verified against the real DANA sandbox. Mandatory compliance checklist: Payment Gateway Payment (5/5 scenarios verified), Finish Notify (3/3 verified), Refund Order (6/9 confirmed matching response codes — the "success" and "inconsistent request" cases need a longer settle delay after sandbox VA payment before retrying, not a code fix), Cancel Order (blocked — DANA's sandbox Cancel Order endpoint was returning `5005701 Internal Server Error` on every attempt regardless of trigger during testing, unrelated to request shape; retry once DANA's sandbox is stable).

---

## Source of truth

Do **not** guess at DANA's request/response shapes or signature scheme — get them from one of these:

1. **`https://dashboard.dana.id/api-docs-v2/llms/**/*.md`** — DANA's own docs, in an LLM-readable form. Individual pages (e.g. `.../llms/api/payment-gateway/create-order-hosted.md`) are fetchable even though the interactive dashboard requires login; `https://dashboard.dana.id/api-docs-v2/llms.txt` is the index.
2. **`github.com/dana-id/uat-script`** — DANA's own official compliance test suite (Node/Go/Java/PHP/Python). `test/node/payment_gateway/*.ts` shows exactly how to call every endpoint with the official `dana-node` SDK; `resource/request/components/PaymentGateway.json` has real request/response fixtures, including the magic trigger values below.
3. **`dana-node` npm package** (installed here) — `dana-node/runtime` exports `DanaSignatureUtil` (signing) and `DanaHeaderUtil`; `dana-node/webhook/v1` exports `WebhookParser` (incoming notify verification, with DANA's sandbox public key baked in).

---

## Merchant credentials

Stored in `tiketq-bosbiller/.env` — **never commit these**:

```
DANA_ENV=sandbox
DANA_API_BASE_URL=https://api.sandbox.dana.id
DANA_MERCHANT_ID=...
DANA_CLIENT_ID=...        # aka X-PARTNER-ID / partnerId
DANA_CLIENT_SECRET=...    # not currently used — signing is asymmetric (RSA), not HMAC
DANA_PUBLIC_KEY=...       # our RSA public key, registered with DANA
DANA_PRIVATE_KEY=...      # our RSA private key — signs every outbound request
```

`scripts/dana-preflight.js` runs automatically before `npm run start` (via the `prestart` script) and fails fast if these are missing or the private key can't sign — no network call, pure local check.

---

## Product: Payment Gateway (`payment-host-to-host.htm`)

The live create-order route (`POST /api/dana/create-order`, `routes/api/dana/index.js`) creates a **native** DANA payment via `createNativePaymentOrder` in `services/danaService.js` — a signed host-to-host call carrying `payOptionDetails` (`payMethod`/`payOption`). Two response shapes come back depending on the method:

- **DANA wallet** (`payMethod: DANA` → DANA `BALANCE`): returns `kind: "REDIRECT"` with a `redirectUrl` (`m.dana.id`) the customer is sent to.
- **Bank virtual accounts** (`BNI`/`BRI`/`MANDIRI`/`CIMB`/`PANIN`): return `kind: "VA"` with a `vaNumber` the customer transfers to.

Supported methods are defined in `PAY_METHOD_MAP`. `QRIS` and `BCA` were **removed** — QRIS requires a registered `externalStoreId` (Create Shop API), and BCA is not enabled for this merchant. `BTPN`/`PERMATA`/`BSI` are also rejected by DANA for this merchant.

> `services/danaService.js` also exports `createRedirectOrder` (a pure hosted-checkout `scenario: "REDIRECT"` helper); it is not used by the current `/create-order` route, which uses the native `createNativePaymentOrder` path for both the wallet and VA methods.

### Amount is always server-derived
`POST /api/dana/create-order` takes only `{ bookingNo, payMethod }`. It resolves the booking from whichever table owns the number (ferry then flight), reads `totalSales`, and charges that. **The client never supplies an amount.** Already-paid bookings are rejected with `409`.

### `externalStoreId` gotcha (DANA `4045408 Invalid Merchant`)
`externalStoreId` is only sent when `process.env.DANA_STORE_ID` is set. It must be a shop registered with DANA (Create Shop API); an unregistered value is rejected with `4045408 Invalid Merchant`. It is required only for QRIS/registered shops and optional for VA — so leave `DANA_STORE_ID` unset unless you have a real registered store ID.

### Signing: asymmetric only (no B2B access token step)
Every outbound call is signed the same way — no separate OAuth/access-token exchange needed for this product:

```
stringToSign = `${httpMethod}:${endpointUrl}:${sha256Hex(requestBody)}:${xTimestamp}`
X-SIGNATURE  = base64(RSA-SHA256-sign(stringToSign, DANA_PRIVATE_KEY))
```

`createNativePaymentOrder` signs the create-order call directly via `DanaSignatureUtil.generateSnapB2BScenarioSignature` (a raw signed `fetch`, because the SDK double-reads the body on these responses). Other calls (`queryPayment`, `cancelOrder`, `refundOrder`) go through the official `dana-node` SDK (`dana.paymentGatewayApi.*`), which signs internally.

### Payment flow
1. Frontend calls `POST /api/dana/create-order` with `{ bookingNo, payMethod }`.
2. Response is either `kind: "REDIRECT"` (send the customer to `redirectUrl`) or `kind: "VA"` (display `vaNumber` + `expiryTime`).
3. DANA calls our Finish Notify webhook (`POST /api/dana-notify-callback`, see `docs/API_REFERENCE.md`) on settlement/expiry — verified via `WebhookParser` (or gated on a signed `queryPayment` confirmation when no DANA public key is configured), verifies the paid amount matches the stored booking total, fulfills the booking, and emits `booking:update` via Socket.io.
4. Cancel/refund: `dana.paymentGatewayApi.cancelOrder`/`refundOrder`, referencing the original `partnerReferenceNo`. **Not currently wired into any route** — the admin cancel/refund feature (`PATCH /api/admin/transactions/:id/cancel`/`refund`) is an internal DB status change only for now, since DANA's `originalReferenceNo` isn't persisted per booking yet and the sandbox Cancel Order endpoint was unstable during testing. Wiring in the real DANA call is a fast-follow.

---

## Testing against the real sandbox

Three throwaway scripts exercise the full mandatory compliance checklist — rerun them whenever credentials rotate or DANA's sandbox needs re-verifying:

- **`node scripts/dana-uat-test.js`** — the 5 "Payment Gateway Payment" scenarios (success + 4 negative cases), using real API calls against `DANA_API_BASE_URL`.
- **`node scripts/dana-notify-uat-test.js <public-https-url>`** — the 3 Finish Notify scenarios. Needs the webhook publicly reachable (e.g. `ngrok http 3001`, then pass the ngrok URL) since DANA's sandbox calls it directly with a real signed request. Uses DANA's documented magic test amounts: `11011.00` → success, `11012.00` → partner-simulated internal server error, `11013.00` → expiry (via a short `validUpTo`).
- **`node scripts/dana-cancel-refund-uat-test.js`** — Cancel Order and Refund Order scenarios, via DANA's documented magic `originalPartnerReferenceNo`/`refundAmount` trigger values (e.g. refund amount `225800.00` → `2025800 Request In Progress`). Creates and pays real sandbox orders via DANA's public `sandbox-tools/execute` VA-payment endpoint first.

All three log full request/response bodies so you can compare returned `responseCode`s against the dashboard checklist directly.

---

## Migration notes

Full replacement of Midtrans (per project decision — no dual-gateway support). The backend migration is complete:

- Backend: the Midtrans token service, `routes/api/flight/payment/midtrans/`, and the Midtrans webhook are all gone. The DANA webhook (`POST /api/dana-notify-callback`) is live, and `services/chatService.js` now exposes a `generate_dana_payment` tool (posting to `/api/dana/create-order`) in place of the old `generate_midtrans_payment`.
- Prisma: no `paymentGateway` column exists (all payments are DANA). The DANA `referenceNo` is still **not** persisted per booking — this is the remaining gap for wiring real cancel/refund (`dana.paymentGatewayApi.cancelOrder`/`refundOrder` reference the original `partnerReferenceNo`, which is the `bookingNo`).
