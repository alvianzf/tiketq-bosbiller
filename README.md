# TiketQ Bosbiller (Backend API)

**AI Context Note:** This document provides explicit tech stack and environment configurations to ensure AI agents have full context before modifying backend logic.

## Tech Stack
- **Runtime:** Node.js v18+
- **Framework:** Express.js `~4.16.1`
- **Database:** PostgreSQL (Managed via `@prisma/client ^6.19.2`)
- **Real-Time:** `socket.io ^4.8.3`
- **Caching/Session:** `redis ^4.6.14`, `node-cache ^5.1.2`
- **Payment Gateway:** `midtrans-client ^1.3.1`
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

# Midtrans
MIDTRANS_SERVER_KEY="server_key_here"
MIDTRANS_CLIENT_KEY="client_key_here"
MIDTRANS_IS_PRODUCTION="false"

# Providers
SINDO_FERRY_API_KEY="api_key"
LION_AIR_API_KEY="api_key"

# AI Chatbot
OPENAI_API_KEY="sk-..."
```

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
