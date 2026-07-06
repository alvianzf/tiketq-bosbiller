# Dana Payment Integration

TiketQ is migrating its payment gateway from Midtrans to **Dana**, using Dana's SNAP API (BI Open API standard) rather than a hosted-redirect checkout. The checkout UI itself is custom-branded (TiketQ styling — QR code + in-app deeplink), not Dana's own widget. This document is the reference for the Dana side of that integration; see `WEBHOOKS_AND_SOCKETS.md` for the Midtrans logic being replaced.

> **Status: integration in progress.** Endpoint paths, request/response shapes, and signing logic below are pending confirmation against Dana's official SNAP API spec (`https://dashboard.dana.id/api-docs-v2/`). Do not treat this file as complete until that section is filled in.

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

## SNAP API — Signing & Endpoints

_To be documented once the official SNAP spec is confirmed. Expected shape, based on the BI-SNAP standard:_

- Request signing via `X-TIMESTAMP` + `X-SIGNATURE` headers, RSA-SHA256 signed with the merchant's private key.
- `X-PARTNER-ID` / `CHANNEL-ID` identify the merchant/channel.
- Core flow: **Create Order (Payment Gateway) API** → returns a QR string / deeplink for the TiketQ-branded checkout screen → Dana calls the Finish Payment notify URL above on settlement → TiketQ updates booking + emits `booking:update` via Socket.io (same pattern as the current Midtrans webhook).

---

## Migration Notes

Full replacement of Midtrans (per project decision — no dual-gateway support). Files touched:

- Backend: `services/createMidtransToken.js`, `routes/api/flight/payment/midtrans/`, `routes/webhooks/index.js` (`/webhooks/midtrans` → `/api/dana-notify-callback`), `services/chatService.js` (`generate_midtrans_payment` tool)
- Frontend (`tiket-FE`): `src/components/Payment/PaymentForm.tsx`, `src/containers/FerryPaymentContainer/index.tsx`, `src/components/ChatBot/ChatMessage.tsx` — all currently load `snap.js`; to be replaced with a custom QR/deeplink checkout component.
- Prisma: no `paymentGateway` column currently exists (gateway is inferred from `order_id` prefix) — will need one for the Dana migration.
