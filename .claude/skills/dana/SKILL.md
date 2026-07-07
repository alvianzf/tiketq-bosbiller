---
name: dana
description: "Implement, extend, or test DANA payment gateway integration in tiketq-bosbiller — creating orders, verifying the Finish Notify webhook, running DANA's mandatory sandbox compliance checklist (Payment Gateway Payment / Finish Notify / Cancel Order / Refund Order), or debugging SNAP signature errors."
---

# DANA Payment Gateway (tiketq-bosbiller)

Full background: `tiketq-bosbiller/docs/DANA_INTEGRATION.md`. This skill is the fast-reference for actually doing DANA work — implementing new calls, or running/re-running the compliance checklist.

## Golden rule: don't guess the contract

DANA's SNAP signature scheme and exact field names are exacting — a wrong field name or signature string fails silently with a generic error code, not a helpful one. Never guess. Get the real contract from:

1. **`https://dashboard.dana.id/api-docs-v2/llms/api/**/*.md`** — fetchable directly even though the interactive dashboard needs login (e.g. `.../llms/api/payment-gateway/create-order-hosted.md`, `.../finish-notify.md`). Index: `https://dashboard.dana.id/api-docs-v2/llms.txt`. If `WebFetch` times out on this domain, ask the user to paste the page — it's public HTML but sometimes slow/blocked from sandboxed environments.
2. **`github.com/dana-id/uat-script`** — clone it (`git clone --depth 1`). `test/node/<product>/*.ts` shows real SDK usage for every endpoint; `resource/request/components/*.json` has real request/response fixtures including magic trigger values (see below). This is DANA's own compliance test suite — treat it as ground truth over any secondhand summary.
3. **`dana-node` npm package** (already a dependency here) — read `node_modules/dana-node/dist/**/*.d.ts` for exact field names/types. Key modules:
   - `dana-node` (main) — `Dana` class, `dana.paymentGatewayApi.{createOrder,cancelOrder,refundOrder,queryPayment}`
   - `dana-node/runtime` — `DanaSignatureUtil` (signing), `DanaHeaderUtil`, `BaseAPI`/`Configuration` (for manual/malformed requests in negative test cases)
   - `dana-node/webhook/v1` — `WebhookParser` (verifies incoming Finish Notify signature; has DANA's sandbox public key baked in when `DANA_ENV=sandbox`)

## Signing scheme (asymmetric only — no B2B token step)

Every outbound call to `payment-host-to-host.htm`/cancel/refund is signed the same way, no OAuth exchange needed for this product:

```
stringToSign = `${httpMethod}:${endpointUrl}:${sha256Hex(requestBody)}:${xTimestamp}`
X-SIGNATURE  = base64(RSA-SHA256-sign(stringToSign, DANA_PRIVATE_KEY))
```

`services/danaService.js` wraps the SDK and handles this — call `dana.paymentGatewayApi.*` rather than re-implementing signing. For negative-path tests that need a malformed/missing header, use `DanaSignatureUtil.generateSnapB2BScenarioSignature` + `BaseAPI`/`Configuration` directly (see `scripts/dana-uat-test.js`'s `manualRequest` helper).

## Credentials

`.env`: `DANA_ENV`, `DANA_API_BASE_URL`, `DANA_MERCHANT_ID`, `DANA_CLIENT_ID` (= partnerId), `DANA_PRIVATE_KEY`, `DANA_PUBLIC_KEY`. `DANA_CLIENT_SECRET` is stored but unused (signing is RSA, not HMAC). `npm run start` runs `scripts/dana-preflight.js` first — a local, network-free check that these are present and the private key can actually sign.

## Re-running the mandatory sandbox compliance checklist

DANA's merchant dashboard has a checklist ("Mandatory API Testing") DANA auto-verifies from its own server logs once you successfully exercise each scenario against the sandbox. Three scripts do this — rerun whenever credentials rotate or a scenario needs re-verifying:

- **`node scripts/dana-uat-test.js`** — Payment Gateway Payment (create order): success + 4 negative cases (missing field, invalid format, inconsistent request, invalid signature). Pure API calls, no external dependencies.
- **`node scripts/dana-notify-uat-test.js <public-https-url>`** — Finish Notify: success / partner-simulated-error / expiry. **Needs the webhook publicly reachable** — start the server (`npm run start`), tunnel it (`ngrok http 3001`), pass the ngrok URL as the argument. Uses DANA's documented magic test amounts on the create-order call: `11011.00` → success notify, `11012.00` → triggers DANA to expect us to respond `5005601` (our webhook already has this hardcoded for sandbox — see `routes/api/dana-notify-callback.js`), `11013.00` with a short `validUpTo` → expiry notify (`latestTransactionStatus: "05"`).
- **`node scripts/dana-cancel-refund-uat-test.js`** — Cancel Order and Refund Order, via DANA's documented magic trigger values embedded in `originalPartnerReferenceNo` (cancel) or `refundAmount.value` (refund) — e.g. refund amount `225800.00` → `2025800 Request In Progress`. First creates and pays a real sandbox order via DANA's public `sandbox-tools/execute` VA-payment endpoint (`https://dashboard-sandbox.dana.id/merchant-portal-app/api/sandbox-tools/execute`, no auth) so there's a real paid order to act on.

All three log full request/response JSON — diff the returned `responseCode` against the dashboard checklist's expected codes directly.

### Known sandbox flakiness (as of this writing)

- VA payment creation (`payOptionDetails[0].payOption: VIRTUAL_ACCOUNT_*`) intermittently 500s (`5005401`) for a few seconds at a time — retry after a short delay before assuming it's a request-shape bug.
- Cancel Order (`payment-host-to-host` cancel) returned `5005701 Internal Server Error` on every attempt regardless of trigger value during one full test session, including on a real just-created order — this looked like sandbox-side instability specific to that endpoint (Create Order and Refund Order worked fine in the same session). If this recurs, it's not necessarily your request — check whether Create/Refund still work before debugging your code.

## Finish Notify webhook

`routes/api/dana-notify-callback.js`, mounted at `POST /api/dana-notify-callback` (this exact path must match whatever's registered as the "Finish Payment URL" in the DANA merchant dashboard, or be passed per-order in `urlParams[].type === "NOTIFICATION"` when testing). Needs the **raw request body** for signature verification — `app.js`'s `express.json()` is configured with a `verify` callback that stashes it on `req.rawBody`; don't swap that out for a different body parser without preserving this.

Response contract (from DANA's own docs, verified live): only `{ responseCode, responseMessage }`, no outbound signature. `2005600`/"Successful" for both success (`latestTransactionStatus: "00"`) and expiry (`"05"`) — DANA doesn't distinguish the ack. `5005601`/500 on real processing errors, and (sandbox-only) when `amount.value === "11012.00"`, per DANA's own compliance-test convention.
