# API Reference

The backend exposes several routes prefixed generally at `/api` or `/webhooks`.

## Core Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`

### Flights
- `GET /api/flight/search` - Searches for available flights.
- `POST /api/flight/book` - Initiates a flight booking.
- `GET /api/flight/check?bookingno={id}` - Checks the status of a flight booking.

### Ferries
- `GET /api/ferry/search` - Searches for available ferry schedules via Sindo Ferry API.
- `POST /api/ferry/book` - Initiates a ferry booking.
- `GET /api/ferry/check?bookingno={id}` - Checks the status of a ferry booking.

### ChatBot (AI)
- `POST /api/chat` - Handled via Socket.io for continuous interactive sessions. See [Webhooks & Sockets](WEBHOOKS_AND_SOCKETS.md).

## Payment Flows
Payments are integrated with Midtrans. A transaction is created when a booking is confirmed, and the client receives a Snap token. The final status is updated asynchronously via webhooks.
