# Webhooks & Sockets

## Webhooks

The backend receives asynchronous payment notifications from **Midtrans** at `/webhooks/midtrans`.

### Flow:
1. Midtrans sends a `POST` request with the transaction status.
2. The router intercepts the `order_id`. If it starts with `ferry-`, it routes to the ferry handler. Otherwise, it defaults to flights.
3. If the status is `capture` or `settlement`:
   - The booking status is marked as `PAID`.
   - Vouchers are fetched (if ferry).
   - E-Tickets and invoices are generated via the PDF service.
   - Confirmation emails are dispatched.
   - A `booking:update` socket event is emitted to notify the frontend instantly.

## Socket.io

Real-time capabilities are driven by Socket.io, initialized in `socket.js`.

### Events Emitted to Client
- `booking:update`: Emitted when a webhook successfully processes a payment. Payload: `{ bookingNo: "..." }`.
- `chat:response_done`: Emitted when the AI chatbot has finished replying.
- `chat:tool_result`: Emitted when the AI chatbot triggers a rich UI card (e.g. flight search forms, Qris payments, WhatsApp buttons).
- `chat:typing`: Emitted while the AI is generating a response.

### Events Received from Client
- `chat:message`: Client sends a message. Handled by `services/chatService.js` to process LLM logic and tool calls.
