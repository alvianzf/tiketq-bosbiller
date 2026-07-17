# TiketQ Bosbiller (Backend API)

The Node.js/Express backend that powers all TiketQ services. It integrates with a third-party flight provider API, the Sindo Ferry API, and DANA for payments (via DANA's SNAP Payment Gateway API). It manages the PostgreSQL database via Prisma ORM, uses Redis for trip and route caching, generates PDF e-tickets with PDFKit, sends transactional emails via Nodemailer, and serves an OpenAI-compatible LLM agentic chatbot over Socket.io. This README covers the full dependency list, all required environment variables with descriptions, and the exact commands to bootstrap and run the server.

## Tech Stack
- **Runtime:** Node.js v18+
- **Framework:** Express.js `~4.16.1`
- **Database:** PostgreSQL (Managed via `@prisma/client ^6.19.2`)
- **Real-Time:** `socket.io ^4.8.3`
- **Caching/Session:** `redis ^4.6.14`, `node-cache ^5.1.2`
- **Payment Gateway:** `dana-node ^2.1.10`
- **PDF Generation:** `pdfkit ^0.18.0`, `svg-to-pdfkit ^0.1.8`
- **AI/LLM:** `openai ^6.39.0`

## Required Environment Variables (`.env`)
Before starting the server, ensure the following variables are strictly defined in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tiketq"
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your_jwt_secret"

# DANA Payment Gateway (SNAP) — see docs/DANA_INTEGRATION.md
DANA_ENV="sandbox"
DANA_API_BASE_URL="https://api.sandbox.dana.id"
DANA_MERCHANT_ID="..."
DANA_CLIENT_ID="..."           # aka X-PARTNER-ID / partnerId
DANA_PRIVATE_KEY="..."         # our RSA private key — signs every outbound request
DANA_PUBLIC_KEY="..."          # our RSA public key, registered with DANA
# Optional: DANA_STORE_ID (only for registered shops/QRIS), DANA_WEBHOOK_PUBLIC_KEY,
# DANA_NOTIFY_URL, DANA_ORIGIN

# Providers
SINDO_FERRY_API_KEY="api_key"
LION_AIR_API_KEY="api_key"

# AI Chatbot (OpenAI-compatible endpoint, not api.openai.com)
SUMOPOD_API_KEY="sk-..."       # NOT OPENAI_API_KEY
AI_BASE_URL="https://..."      # custom OpenAI-compatible base URL
AI_MODEL="gemini/gemini-2.5-flash-lite"
```

> `scripts/dana-preflight.js` runs automatically before `npm run start` (via the `prestart` script) and fails fast if the DANA vars are missing or the private key can't sign.

## Setup & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Start the server:**
   ```bash
   npm run start
   ```
