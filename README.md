# TiketQ Bosbiller (Backend API)

This is the primary Node.js/Express backend for the TiketQ ecosystem. It orchestrates interactions between the frontend, databases, third-party ticketing providers (like Sindo Ferry and Lion Air), payment gateways (Midtrans), and real-time socket connections.

## Requirements
- Node.js (v18+)
- Postgres / MySQL Database
- Redis (for caching and session storage)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file based on the required services (Database URLs, Midtrans keys, Provider credentials).

3. **Start the server:**
   ```bash
   npm run start
   ```

## Documentation Wiki

Explore the detailed documentation in the `docs/` folder:
- [Home & Overview](docs/HOME.md)
- [API Reference](docs/API_REFERENCE.md)
- [Webhooks & Sockets](docs/WEBHOOKS_AND_SOCKETS.md)
- [System Architecture](docs/ARCHITECTURE.md)
