# 00 — Overview

**System:** `tiketq-bosbiller` — the backend API and real-time server for the TiketQ travel-booking platform.
**Document set:** Software Design Document (SDD). This file is the entry point; the remaining sections are indexed in [§ Spec File Index](#spec-file-index).

> Ground-truth note: Every statement in this SDD was written against the actual source under
> `tiketq-bosbiller/` (routes, services, DAOs, `prisma/schema.prisma`, middleware, `app.js`, `bin/www`, `socket.js`).
> Where the code diverges from prior repo documentation (e.g. port number, integration env-var names, a
> stale AI tool enum), the code is treated as authoritative and the divergence is called out explicitly.

---

## 1. Product Purpose

`tiketq-bosbiller` is a Node.js/Express service that powers a consumer travel-booking platform selling three
product lines:

- **Flights** — searched and issued through a third-party "Pesawat" flight provider (Bosbiller-style API).
- **Ferries** — Batam ⇄ Singapore crossings booked through the Sindo Ferry agent API.
- **Car rentals** — an internally-managed inventory with a manual review/approval workflow.

The service exposes a REST API (mounted under `/api`), a Socket.io real-time channel (booking updates and an
AI chat assistant), server-rendered PDF e-tickets/invoices, transactional email, and a DANA payment
integration (SNAP). It is the single writer of the PostgreSQL database (via Prisma) and the single caller of
all third-party booking/payment providers.

## 2. Scope

**In scope (implemented in this codebase):**

- Flight search (with Redis caching), booking creation, provider ticket issuance, and payment settlement.
- Ferry route/trip search, multi-step booking against Sindo Ferry, server-authoritative pricing, voucher retrieval.
- Car-rental inventory CRUD, photo uploads, and rental-request intake with KTP image upload.
- DANA payments: native VA (bank virtual accounts) and DANA-wallet redirect, plus the Finish-Notify webhook.
- Post-payment fulfillment (idempotent claim → ticket issuance → e-ticket/invoice email → `booking:update` emit).
- Guest booking-history lookup by email (no auth).
- Admin dashboard back-end: transactions, stats, health, logs, user management, and a server-ops console.
- JWT auth (bcrypt), rate limiting, an AI chat assistant over Socket.io with 9 tool functions.

**Out of scope / explicitly absent:**

- **No Midtrans integration.** Midtrans was removed; there is **no** `/hooks/midtrans` route and no Midtrans
  webhook handler anywhere in the code. Stale `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` keys remain in
  `.env` but are read by no code. See [`03-API-REFERENCE.md`](03-API-REFERENCE.md) and [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md).
- **No test runner.** No test framework is configured; `package.json` defines only `prestart` and `start`.
  Root-level `test_*.js` files are ad-hoc manual scripts, not an automated suite.
- **No frontend.** The consumer app (`tiket-FE`) and ops dashboard (`tiket-admin`) are separate subprojects.

## 3. Primary Consumers

| Consumer | Nature | How it talks to the backend |
|----------|--------|------------------------------|
| `tiket-FE` | Consumer booking web app (Next.js) | REST under `/api` + Socket.io (booking updates, AI chat) |
| `tiket-admin` | Internal ops dashboard (Vite/React) | REST under `/api/admin/*` (JWT admin) + general `/api` reads |
| Third-party gateways | DANA (webhook callback), browsers redirected back from DANA | `POST /api/dana-notify-callback`, `PAY_RETURN` redirect URL |

## 4. High-Level Capability List

1. **Flight domain** — airport/airline reference data, flight search, booking, payment/issuance, booking lookup.
2. **Ferry domain** — sectors/routes/countries master data, trip search, unified multi-step booking, pricing, order vouchers, print/WhatsApp/email dispatch.
3. **Car-rental domain** — car CRUD, photo management, public search/types, rental-request submission and status.
4. **Payments (DANA)** — create-order (VA + wallet redirect) and Finish-Notify webhook with amount verification.
5. **Fulfillment** — one idempotent code path settling flight and ferry bookings post-payment.
6. **Auth & users** — register/login, admin login, `/me`, admin-only user management.
7. **Admin ops** — transactions list, cancel/refund, stats, health, logs, and a guarded server console.
8. **Real-time** — Socket.io `booking:update` broadcasts and an AI chat assistant (`chat:*` events).
9. **History** — guest booking history by email.
10. **Cross-cutting** — Redis + in-memory caching, JWT/bcrypt security, rate limiting, PDF & email generation.

## 5. Glossary

| Term | Meaning in this system |
|------|------------------------|
| **Booking** | A stored order for a product. Flight → `FlightBooking` (`bookingCode`), Ferry → `FerryBooking` (`bookingNo`, which is the Sindo booking GUID), Car → `CarRentalRequest`. Each has an owning `Transaction`. |
| **Transaction** | The unifying financial record (`Transaction` model) linked 1:1 to exactly one booking; carries `serviceType`, `payment_status`, `status`, and money fields. |
| **E-ticket** | A PDF generated server-side after settlement (`pdfService` for flights, `ferryPdfService` for ferries) and emailed to the customer alongside an invoice PDF. |
| **VA (Virtual Account)** | A bank virtual-account number the customer transfers to. Produced by DANA for `payMethod` BNI/BRI/MANDIRI/CIMB/PANIN. |
| **DANA wallet (BALANCE)** | The `payMethod: DANA` option; returns a `webRedirectUrl` to the DANA hosted checkout instead of a VA number. |
| **DANA SNAP** | Indonesia's SNAP open-API standard. DANA requests are signed with asymmetric RSA-SHA256 over a canonical string-to-sign; the notify webhook is verified against DANA's public key. See [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md). |
| **DAO** | Data Access Object — a class in `db/dao/` that is the *only* sanctioned path to Prisma. See [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md). |
| **Fulfillment** | Post-payment settlement: atomically claim the unpaid booking, issue the ticket/voucher, email documents, and emit `booking:update`. Implemented in `services/bookingFulfillment.js`. |
| **Finish Notify** | DANA's asynchronous payment-result webhook (`POST /api/dana-notify-callback`). |

## 6. Spec File Index

| File | Section |
|------|---------|
| [`00-OVERVIEW.md`](00-OVERVIEW.md) | Product purpose, scope, consumers, glossary (this file) |
| [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md) | Tech stack, system context, layering, DAO pattern, directory & routing map |
| [`02-DATA-MODEL.md`](02-DATA-MODEL.md) | Prisma models, enums, relations, ER diagram, migrations |
| [`03-API-REFERENCE.md`](03-API-REFERENCE.md) | REST endpoint catalog grouped by domain |
| [`04-PAYMENTS-DANA.md`](04-PAYMENTS-DANA.md) | DANA SNAP signing, create-order, notify webhook, sequence diagrams |
| [`05-INTEGRATIONS.md`](05-INTEGRATIONS.md) | Sindo Ferry, flight provider (+ mock), AI chatbot & tools |
| [`06-REALTIME-AND-WEBHOOKS.md`](06-REALTIME-AND-WEBHOOKS.md) | Socket.io architecture, `booking:update`, chat events, notify flow |
| [`07-SECURITY-AND-AUTH.md`](07-SECURITY-AND-AUTH.md) | JWT/bcrypt, admin middleware, DAO discipline, price derivation, error hygiene |
| [`08-DEPLOYMENT.md`](08-DEPLOYMENT.md) | Env vars, scripts, prisma, ports, DANA preflight |
