# Dana Payment Integration

TiketQ is migrating its payment gateway from Midtrans to **Dana**, using Dana's SNAP API (Gapura Payment Gateway — Hosted Checkout). This document is the reference for the Dana side of that integration; see `WEBHOOKS_AND_SOCKETS.md` for the Midtrans logic being replaced.

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

## Product: Gapura Payment Gateway — Hosted Checkout

Confirmed against DANA's own docs: `additionalInfo.order.scenario: "REDIRECT"` returns a `webRedirectUrl` in the create-order response, which the customer is redirected to for payment (Hosted Checkout). This is what the mandatory compliance checklist tests (`payment-host-to-host.htm` + "Displaying webRedirectUrl to the users" as the partner action) — **not** the Custom Checkout / QR-deeplink flow an earlier draft of this doc assumed.

### Signing: asymmetric only (no B2B access token step)
Every outbound call (`payment-host-to-host.htm`, cancel, refund) is signed the same way — no separate OAuth/access-token exchange needed for this product:

```
stringToSign = `${httpMethod}:${endpointUrl}:${sha256Hex(requestBody)}:${xTimestamp}`
X-SIGNATURE  = base64(RSA-SHA256-sign(stringToSign, DANA_PRIVATE_KEY))
```

`services/danaService.js` wraps the official `dana-node` SDK (`dana.paymentGatewayApi.createOrder/cancelOrder/refundOrder`), which handles this signing internally — call it directly rather than re-implementing signature logic.

### Payment flow
1. Backend calls `dana.paymentGatewayApi.createOrder(...)` with `partnerReferenceNo`, `amount`, `urlParams` (`PAY_RETURN` + `NOTIFICATION`), and `additionalInfo.order.scenario: "REDIRECT"`.
2. Response includes `webRedirectUrl` — redirect the customer there.
3. DANA calls our Finish Notify webhook (`POST /api/dana-notify-callback`, see `docs/API_REFERENCE.md`) on settlement/expiry — verified via `WebhookParser`, updates the booking, emits `booking:update` via Socket.io (same pattern as the Midtrans webhook).
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

Full replacement of Midtrans (per project decision — no dual-gateway support). Files touched when the migration completes:

- Backend: `services/createMidtransToken.js`, `routes/api/flight/payment/midtrans/`, `routes/webhooks/index.js` (`/hooks/midtrans` → `/api/dana-notify-callback`, already live), `services/chatService.js` (`generate_midtrans_payment` tool)
- Frontend (`tiket-FE`): `src/components/Payment/PaymentForm.tsx`, `src/containers/FerryPaymentContainer/index.tsx`, `src/components/ChatBot/ChatMessage.tsx` — all currently load `snap.js`; to be replaced with a redirect to DANA's `webRedirectUrl`.
- Prisma: no `paymentGateway` column exists yet (gateway is inferred from `order_id`/`bookingCode` prefix) — will need one once both gateways run side by side during cutover, or the DANA `referenceNo` will need persisting per booking regardless (needed for real cancel/refund).
