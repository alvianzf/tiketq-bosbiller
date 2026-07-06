# Dana Payment Integration

TiketQ is migrating its payment gateway from Midtrans to **Dana**, using Dana's SNAP API (BI Open API standard) rather than a hosted-redirect checkout. The checkout UI itself is custom-branded (TiketQ styling — QR code + in-app deeplink), not Dana's own widget. This document is the reference for the Dana side of that integration; see `WEBHOOKS_AND_SOCKETS.md` for the Midtrans logic being replaced.

> **Status: integration in progress.** The product/auth model (Gapura Payment Gateway, Custom Checkout, SNAP asymmetric+symmetric signing) is confirmed. Exact endpoint paths and payload field names are **not yet verified** against Dana's own docs (`https://dashboard.dana.id/api-docs-v2/`, which requires login) — confirm in your sandbox dashboard before implementing.

---

## Merchant Credentials

Configured in Dana's merchant dashboard. Stored in `tiketq-bosbiller/.env` — **never commit these**:

```
DANA_MERCHANT_ID=216620080021022966627
DANA_CLIENT_ID=2025082116062984778343
DANA_CLIENT_SECRET=<stored in .env only>
```

---

## Mandatory Endpoints (registered in Dana merchant dashboard)

| Field | URL | Purpose |
|---|---|---|
| Finish Payment URL (Notify callback) | `https://tiketq.com/api/dana-notify-callback` | Dana calls this server-to-server after a payment attempt completes. Replaces `POST /webhooks/midtrans`. |
| Disbursement Notify URL | _(not configured — not used by TiketQ's flow)_ | Only relevant for merchants disbursing funds out to bank accounts. |
| Finish Redirect URL | `https://tiketq.com/dana-transaction-status` | Where the user lands after completing payment in the Dana app/webview. Only applies to flows requiring account binding. |

---

## Product: Gapura Payment Gateway — Custom Checkout

Dana's PG product is **Gapura Payment Gateway**, offered in two modes:

- **Hosted Checkout** — Dana hosts the payment page; customer is redirected there and back. (This is the "redirect" flow we explicitly decided against.)
- **Custom Checkout** — TiketQ builds its own checkout UI and calls Dana's APIs directly. **This is the mode we're using** ("SNAP with our branding").

> **Not yet verified**: the details below come from a secondhand summary of Dana's docs (another Claude session's research), not from directly reading `dashboard.dana.id/api-docs-v2` ourselves. Treat the auth model and process steps as reliable; treat exact endpoint paths/payload field names as **illustrative only** until confirmed against the actual Custom Checkout spec in your sandbox dashboard.

### SNAP authentication (two signature types)

1. **Asymmetric (RSA)** — used once to call the B2B Token endpoint and obtain a short-lived access token. Requires an RSA keypair generated via the dashboard's Signature Document page.
2. **Symmetric (HMAC-SHA512)** — using `DANA_CLIENT_SECRET`, signs every subsequent transactional API call (`X-TIMESTAMP`, `X-SIGNATURE`, `X-PARTNER-ID`, `X-EXTERNAL-ID` headers).

### Payment flow (Custom Checkout, pay-once, no account binding)

1. Backend calls Dana's Create Payment API (exact path TBD — confirm Custom Checkout's specific endpoint, distinct from the `direct-debit/core/v1/debit/payment-host-to-host` example seen for Hosted Checkout) with `partnerReferenceNo`, `amount`, and order metadata.
2. Response returns QR string / deeplink data (Custom Checkout) instead of a `webRedirectUrl` (that field is the Hosted Checkout response shape).
3. TiketQ renders its own branded checkout screen (QR code + "Open Dana app" deeplink button).
4. Dana calls the Finish Payment URL above on settlement — TiketQ verifies the signature, updates booking, emits `booking:update` via Socket.io (same pattern as the current Midtrans webhook).
5. Refunds: separate endpoint referencing the original `partnerReferenceNo`.

### Go-live process (sandbox → production)

1. Complete Business Information + Legal Document verification in the dashboard.
2. Complete the **Integration Checklist** — all sandbox scenario tests for Gapura Payment Gateway must show "completed."
3. **UAT Sign-Off** — dashboard auto-generates a report from test logs; your IT rep signs it.
4. **Devsite Test** — mandatory SNAP/Bank Indonesia compliance step, requires an ASPI account; can take ~2 hours to complete.
5. Generate production keys, configure production Notify/Redirect URLs (get whitelisted), submit for review → production credentials issued.

---

## Migration Notes

Full replacement of Midtrans (per project decision — no dual-gateway support). Files touched:

- Backend: `services/createMidtransToken.js`, `routes/api/flight/payment/midtrans/`, `routes/webhooks/index.js` (`/webhooks/midtrans` → `/api/dana-notify-callback`), `services/chatService.js` (`generate_midtrans_payment` tool)
- Frontend (`tiket-FE`): `src/components/Payment/PaymentForm.tsx`, `src/containers/FerryPaymentContainer/index.tsx`, `src/components/ChatBot/ChatMessage.tsx` — all currently load `snap.js`; to be replaced with a custom QR/deeplink checkout component.
- Prisma: no `paymentGateway` column currently exists (gateway is inferred from `order_id` prefix) — will need one for the Dana migration.
