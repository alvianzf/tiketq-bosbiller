# TiketQ Bosbiller Backend — Possible Future Development

This document establishes the comprehensive future development and engineering roadmap for the Node.js/Express backend API (`tiketq-bosbiller`). It details key items to strengthen API architecture, implement payments, manage data reliability, improve observability, expand automated testing, and secure the overall infrastructure.

---

## Backend API Engineering Checklist

### API & Architecture

- [ ] **API versioning** — Prefix all routes with `/v1/` (e.g., `/api/v1/flight/search`) to allow non-breaking future iterations.
- [ ] **Rate limiting** — Add `express-rate-limit` middleware, especially on `/api/auth/`, `/webhooks/midtrans`, and the AI chat endpoint to prevent abuse.
- [ ] **Request schema validation** — Add `zod` or `express-validator` schemas to all ferry and flight route handlers (currently only auth routes are validated).
- [ ] **Centralized error handler** — Replace scattered `next(error)` calls with a single Express error-handling middleware that returns consistent `{ error, code, details }` shapes.
- [ ] **API key authentication for third-party access** — Allow trusted external partners to access select endpoints with an API key instead of JWT.
- [ ] **Pagination on list endpoints** — `/api/admin/transactions` currently returns all records. Add `page` and `limit` query params.

### Real-time & Sockets

- [ ] **Persistent chatbot sessions via Redis** — Move `ChatService.sessions` Map to Redis with a TTL to survive server restarts and support horizontal scaling.
- [ ] **Multi-session per user** — Allow users to have named/saved conversation threads.
- [ ] **Tool call error retry** — Implement automatic retry with exponential backoff when a tool call fails due to a transient Sindo/flight API error.
- [ ] **Guardrail logging** — Log every instance where the STRICT GUARDRAIL fires to monitor chatbot prompt engineering/misuse patterns.

### Payments & Transaction Flows

- [ ] **Midtrans refund API integration** — Currently there is no refund endpoint. Implement `POST /api/payment/refund` using the Midtrans Refund API.
- [ ] **Manual payment confirmation** — Admin endpoint to manually mark a booking as paid (for bank transfer orders that don't go through Midtrans).
- [ ] **Invoice PDF generation** — Auto-generate and email an invoice PDF (distinct from the e-ticket) immediately after payment.

### Data Model & Storage

- [ ] **Database migrations strategy** — Document and enforce `npx prisma migrate dev` workflow. Currently `npx prisma db push` may be used for quick changes, which is not safe for production.
- [ ] **Database connection pooling** — Configure Prisma's `connection_limit` and `pool_timeout` for the production PostgreSQL URL.
- [ ] **Redis cache invalidation strategy** — The `ferry:all_routes` and `ferry:all_countries` keys are cached for 24 hours with no invalidation mechanism. Add a `POST /api/admin/cache/clear` endpoint.
- [ ] **Automated database backups** — Schedule daily `pg_dump` snapshots stored to an S3 bucket or equivalent.
- [ ] **Soft deletes** — Add `deletedAt DateTime?` to User and Transaction models to prevent accidental hard deletes.

### Observability & Monitoring

- [ ] **Structured logging** — Replace `console.log/error` with a structured logger like `pino` for JSON log output.
- [ ] **Error tracking** — Integrate Sentry (`@sentry/node`) for automatic error capture and alerting.
- [ ] **Health check endpoint improvements** — The existing `/api/admin/health` endpoint is solid; extend it to check Redis connectivity and Sindo Ferry API reachability.
- [ ] **Prometheus metrics** — Expose `/metrics` endpoint for request latency, error rates, and queue depth.

### Testing & Verification

- [ ] **Unit tests for services** — Add Jest test suites for `chatService.js`, `pdfService.js`, `ferryPdfService.js`, and `emailService.js`.
- [ ] **Integration tests for routes** — Use `supertest` to test key endpoints (`POST /api/ferry/booking`, `POST /webhooks/midtrans`) with mock external APIs.
- [ ] **CI/CD pipeline** — Add GitHub Actions workflow: lint → test → build → deploy.

---

## Infrastructure & Cross-Cutting Features (Backend Relevance)

- [ ] **Unified monorepo tooling** — Set up a Turborepo or Nx workspace at the `/tiketq/` root for shared scripts and dependency management.
- [ ] **Docker Compose for local dev** — Single `docker-compose.yml` at the root to spin up PostgreSQL, Redis, `tiketq-bosbiller`, `tiket-FE`, and `tiket-admin` in one command.
- [ ] **Staging environment** — Set up a staging stack (`api.staging.tiketq.com`) for QA before production deploys.
- [ ] **SSL/TLS enforcement** — Ensure all HTTP traffic is redirected to HTTPS at the Nginx layer.
- [ ] **CDN for static assets** — Serve static files and PDF assets via Cloudflare or AWS CloudFront.
