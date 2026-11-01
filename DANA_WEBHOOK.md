# DANA Payment Proxy — External Integration Guide

This document is for the **external product** integrating with TiketQ's DANA
payment gateway proxy. It is a temporary arrangement: TiketQ's backend server
has an IP that is whitelisted by DANA; yours is not. This proxy lets you
create DANA payments and receive payment results through TiketQ's server
until your own IP is whitelisted directly with DANA.

**Status: temporary / stopgap.** TiketQ reserves the right to retire this
proxy once your product's IP is whitelisted by DANA directly.

---

## 1. Base URL

```
https://api.tiketq.com
```

All calls must be made over HTTPS. Plain HTTP is not accepted in production.

## 2. Authentication

Every request to the proxy must include this header:

```
X-Service-Key: <shared secret, provided to you out-of-band>
```

- Missing or incorrect key → `401 Unauthorized`.
- This is a single shared secret, not a per-user token. **Do not expose it to
  browsers/clients** — call the proxy only from your own backend server.
- Treat this secret as equivalent to a payment-gateway credential: whoever
  holds it can create real DANA charges under TiketQ's merchant account.
  Rotate it immediately if it leaks, and tell TiketQ so the value on their
  side is rotated too (both sides must be updated together, or every call
  will start failing with 401).

## 3. Creating a payment: `POST /api/dana-proxy/create-order`

### Request

```
POST https://api.tiketq.com/api/dana-proxy/create-order
Content-Type: application/json
X-Service-Key: <shared secret>
```

```json
{
  "referenceNo": "EXT-<your-order-id>",
  "amountValue": "150000.00",
  "orderTitle": "Order #1234",
  "payMethod": "BNI"
}
```

| Field         | Type   | Required | Rules |
|---------------|--------|----------|-------|
| `referenceNo` | string | yes | **Must start with the literal prefix `EXT-`.** This is how TiketQ's systems tell your orders apart from its own bookings. A request without this prefix is rejected with `400`. Must be unique per payment attempt — see the "retrying a payment" note below. |
| `amountValue` | string | yes | The IDR amount as a string with exactly 2 decimal places, e.g. `"150000.00"`. Not a number, not `"150000"`. This is the amount DANA will charge — **TiketQ does not independently verify it**, because your orders aren't in TiketQ's database. You are fully responsible for sending the correct amount. |
| `orderTitle`  | string | no | Free-text description shown to the payer in the DANA checkout UI. Falls back to a generic title if omitted. |
| `payMethod`   | string | yes | One of: `DANA`, `BNI`, `BRI`, `MANDIRI`, `CIMB`, `PANIN` (see table below). |

### Payment methods (`payMethod`)

| Value     | What it is                      | Response `kind` | What the payer does |
|-----------|----------------------------------|------------------|----------------------|
| `DANA`    | DANA e-wallet balance            | `REDIRECT`       | You redirect the payer's browser to `redirectUrl` (DANA's own checkout/app). |
| `BNI`     | Bank BNI virtual account         | `VA`             | Payer transfers to `vaNumber` from their BNI account/app. |
| `BRI`     | Bank BRI virtual account         | `VA`             | Payer transfers to `vaNumber` from their BRI account/app. |
| `MANDIRI` | Bank Mandiri virtual account     | `VA`             | Payer transfers to `vaNumber` from their Mandiri account/app. |
| `CIMB`    | Bank CIMB virtual account        | `VA`             | Payer transfers to `vaNumber` from their CIMB account/app. |
| `PANIN`   | Bank Panin virtual account       | `VA`             | Payer transfers to `vaNumber` from their Panin account/app. |
| `QRIS`    | Scan-to-pay QR code              | `QR`             | **Not usable yet — see below.** Once live, you render `qrContent` as a QR code for the payer to scan. |

**QRIS is currently NOT usable.** It requires a DANA "shop" (`externalStoreId`)
registered and activated on TiketQ's merchant account. As of this writing
that shop is still pending activation on DANA's side (verified live:
`4045408 Invalid Merchant`). Calling `create-order` with `payMethod: "QRIS"`
today returns a `502`. TiketQ will update this doc and notify you once it's
confirmed working — don't build against it until then.

BCA is also **not available** — not enabled for this merchant account.
Don't offer either in your UI yet.

### Success response — `200 OK`

```json
{
  "method": "BNI",
  "kind": "VA",
  "vaNumber": "9881234567890123",
  "redirectUrl": null,
  "paymentCode": "9881234567890123",
  "expiryTime": "2026-11-01T18:30:00+07:00",
  "referenceNo": "EXT-<your-order-id>"
}
```

- When `kind` is `"VA"`: show `vaNumber` and `expiryTime` to the payer. `redirectUrl`/`qrContent` are `null`.
- When `kind` is `"REDIRECT"` (the `DANA` method): redirect the payer's browser to `redirectUrl`. `vaNumber`/`paymentCode`/`qrContent` are `null`.
- When `kind` is `"QR"` (the `QRIS` method, once live): render `qrContent` as a scannable QR code. `vaNumber`/`redirectUrl` are `null`.
- `expiryTime` is in `YYYY-MM-DDTHH:mm:ss+07:00` format (GMT+7, DANA's required timezone). The payment expires at this time if unpaid.

### Error responses

| Status | Meaning |
|--------|---------|
| `400`  | Bad request — missing/invalid `referenceNo`, `amountValue`, or `payMethod`. The `message` field explains which. |
| `401`  | Missing or wrong `X-Service-Key`. |
| `502`  | DANA's gateway rejected the order or is unavailable. The `message`/`detail` fields carry DANA's own error. Safe to retry after a short delay. |
| `503`  | The proxy itself isn't configured on TiketQ's side (shouldn't happen once live) — contact TiketQ. |

### Retrying a payment / switching method

Reusing the **same** `referenceNo` with a **different** `payMethod` is
rejected by DANA (`4045418 Inconsistent Request`). If a payer wants to
switch payment methods, generate a **new** `referenceNo` (e.g. append a
suffix: `EXT-1234-2`) for the retry.

---

## 4. Receiving the payment result (webhook)

When DANA settles a payment (paid, or expired/cancelled), TiketQ's server
receives DANA's notification, verifies it, and forwards the result to **your**
webhook URL.

### What you need to give TiketQ

A single HTTPS URL on your backend that can receive:

```
POST <your webhook URL>
Content-Type: application/json
X-Service-Key: <the same shared secret>
```

```json
{
  "referenceNo": "EXT-<your-order-id>",
  "status": "00",
  "amount": { "value": "150000.00", "currency": "IDR" }
}
```

| Field         | Meaning |
|---------------|---------|
| `referenceNo` | The exact `referenceNo` you sent in the create-order request. |
| `status`      | DANA's raw transaction status code. `"00"` = **paid successfully**. `"05"` = expired/closed without payment. Treat any value other than `"00"` as "not paid" — don't assume you've seen every possible code. |
| `amount`      | The amount DANA recorded for this transaction. `value` is a string with 2 decimals, `currency` is always `"IDR"`. |

### What your endpoint must do

1. **Verify `X-Service-Key` matches the shared secret.** Reject anything else with `401`. TiketQ does not sign the forwarded payload any other way — the shared secret is the only authentication.
2. **Respond `200 OK` quickly** (TiketQ's forward has a 10-second timeout). Do slow work (sending confirmation emails, etc.) after responding, not before.
3. **Be idempotent.** Treat a repeat delivery for a `referenceNo` you've already marked paid as a no-op, not an error. DANA/TiketQ may redeliver.
4. **Only act on `status: "00"`.** Any other status means the payment did not succeed — release any held inventory, show the payer a failure/expiry state, etc.

### Known limitation — no retry on the forward

This forward is still **best-effort, single attempt**. If your endpoint is
down or times out when TiketQ tries to forward, the notification is logged
on TiketQ's side and **dropped** — it is not queued or redelivered. Use the
status-check endpoint below as your backstop when you suspect you missed one
(e.g. an order sitting unresolved past its `expiryTime`).

---

## 5. Checking status directly: `GET /api/dana-proxy/status/:referenceNo`

A fallback for when the webhook forward above is missed — ask TiketQ
directly for the current status of an order you created through this proxy.

### Request

```
GET https://api.tiketq.com/api/dana-proxy/status/EXT-<your-order-id>
X-Service-Key: <shared secret>
```

### Response — `200 OK`

```json
{
  "referenceNo": "EXT-<your-order-id>",
  "status": "00",
  "amount": { "value": "150000.00", "currency": "IDR" }
}
```

`status` uses the same codes as the webhook (`"00"` = paid, `"05"` =
expired/closed). If DANA has no record of the reference at all (e.g. you
query before `create-order` ever succeeded, or typo'd the reference),
`status` is `"NOT_FOUND"` and `amount` is `null`.

| Status | Meaning |
|--------|---------|
| `200`  | Query succeeded — check `status` in the body (including `"NOT_FOUND"`). |
| `400`  | `referenceNo` missing or doesn't start with `EXT-`. |
| `401`  | Missing or wrong `X-Service-Key`. |
| `502`  | DANA's gateway is unavailable or returned an unexpected error. Safe to retry after a short delay. |

Don't poll this aggressively — it's meant as an occasional backstop, not a
replacement for the webhook. A reasonable pattern: if no webhook arrives
within a few minutes of `expiryTime`, check status once before giving up on
the order.

---

## 6. Summary checklist

- [ ] You have the shared secret (`X-Service-Key` value) from TiketQ, delivered out-of-band (not over email/Slack in plaintext if avoidable).
- [ ] All `referenceNo` values you send start with `EXT-` and are unique per payment attempt.
- [ ] `amountValue` is always a string with exactly 2 decimals.
- [ ] You handle `kind: "VA"` (show VA number), `kind: "REDIRECT"` (redirect browser), and — once QRIS is confirmed live — `kind: "QR"` (render `qrContent`) responses. You are NOT using `payMethod: "QRIS"` yet.
- [ ] You've given TiketQ your webhook URL, and it's reachable over HTTPS from the public internet.
- [ ] Your webhook handler checks `X-Service-Key`, responds `200` fast, and is idempotent on `referenceNo`.
- [ ] You only treat `status: "00"` as paid.
- [ ] You use `GET /api/dana-proxy/status/:referenceNo` as a backstop for orders that never get a webhook result.

## 7. This is temporary

This proxy exists only because your product's IP isn't yet whitelisted by
DANA directly. Once it is, TiketQ's expectation is that you integrate with
DANA directly and this proxy is retired. Please don't build long-term
architecture assuming this endpoint is permanent.
