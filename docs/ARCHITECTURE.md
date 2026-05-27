# System Architecture

The `tiketq-bosbiller` backend follows a modular architectural pattern.

## Directory Structure
- `/bin`: Entry point for the Express server.
- `/routes`: Express routers defining all API endpoints and webhooks.
- `/services`: Core business logic (e.g., `chatService.js`, `pdfService.js`, `emailService.js`).
- `/db`: Database connection and Data Access Objects (DAOs).
  - `/dao`: Abstraction layer for database queries (`FlightBookingDAO.js`, `FerryBookingDAO.js`).
- `/utils`: Helper functions and utilities (e.g., `redisClient.js`).

## PDF Generation
When a booking is confirmed, E-Tickets and Invoices are generated dynamically. We use templates populated with booking data to generate binary PDF buffers which are then attached to emails.

## AI Chat Service
Located in `services/chatService.js`, this service acts as an intelligent agent capable of parsing natural language to assist users with booking. It defines specific "tools" (JSON schema functions) that the LLM can trigger, such as `execute_flight_booking`, `show_qris_payment`, and `show_customer_service`.
