# Webhooks & Socket.io

This document is the single reference for all real-time communication in TiketQ. It covers three interconnected systems: (1) the DANA Finish Notify payment webhook at `POST /api/dana-notify-callback` — its payload shape, the ferry vs. flight branching logic, the amount-match verification, and how it emits the `booking:update` event; (2) the Socket.io server configuration including the CORS policy for production vs. development; and (3) the complete AI chat service — the LLM model configuration, the exact system prompt injected into every session, all 8 tool definitions with their full JSON parameter schemas, the agentic tool loop implementation, and a full typed catalog of every socket event (client → server and server → client) including all sub-types of `chat:tool_result`. This document should be read in full before modifying any real-time feature, webhook, or the chatbot.

> **Payment is DANA-only.** Midtrans has been removed — there is no `POST /webhooks/midtrans` route and no `midtrans-client` in source. See `docs/DANA_INTEGRATION.md` for the full payment integration.

---

## Socket.io Server Initialization (`socket.js`)

```javascript
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // ONLY allows localhost origins in dev.
      // Production: CORS is handled at the Nginx proxy layer, not here.
      if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

To emit from any route file outside `socket.js`:
```javascript
const io = require('../../socket').getIo();
io.emit('event_name', payload);
```

---

## DANA Finish Notify Webhook (`routes/api/dana-notify-callback.js`)

**Endpoint:** `POST /api/dana-notify-callback`  
Called asynchronously by DANA (registered as the merchant's "Finish Payment URL") after a payment attempt completes.

**DANA sends** (`latestTransactionStatus`: `"00"` = success, `"05"` = closed/expired):
```json
{
  "originalPartnerReferenceNo": "<our bookingNo / bookingCode>",
  "originalReferenceNo": "20260707...",
  "merchantId": "216620080012019918983",
  "amount": { "value": "350000.00", "currency": "IDR" },
  "latestTransactionStatus": "00",
  "finishedTime": "2026-07-07T19:00:01+07:00"
}
```

**Logic flow:**
1. **Signature verification.** If a DANA public key is configured, `dana-node/webhook/v1`'s `WebhookParser` verifies the SNAP signature (missing/invalid → `401`). If no public key is available (`DANA_WEBHOOK_PUBLIC_KEY` unset), the body is parsed unverified but every status change is gated on a signed `queryPayment` confirmation to DANA (`confirmPaidWithDana`).
2. On `latestTransactionStatus === "00"`, resolves ferry vs. flight by which booking table owns the `bookingNo` (`FerryBookingDAO.existsByNo`).
3. **Amount verification.** When a stored booking exists, the paid `amount.value` must match the booking's `totalSales` (rounded), else the notify is rejected with `500` — an underpaid/tampered settlement cannot issue a ticket.
4. Fulfillment (mark PAID, issue tickets/vouchers, email, then emit `booking:update`) runs via `fulfillFerryBooking` / `fulfillFlightBooking` in `services/bookingFulfillment.js`. Fulfillment is idempotent, so duplicate notify deliveries are no-ops.
5. `latestTransactionStatus === "05"` is acknowledged only, no DB write.
6. Sandbox only: `amount.value === "11012.00"` triggers DANA's mandatory "partner simulates internal server error" compliance scenario — responds `5005601`/500.

Acks with `{ responseCode: "2005600", responseMessage: "Successful" }` on success.

The `booking:update` emit lives in `services/bookingFulfillment.js`:
```javascript
require('../socket').getIo().emit("booking:update", { bookingNo });
```

---

## AI Chat Service Configuration (`services/chatService.js`)

The chatbot uses an **OpenAI-compatible API endpoint** (not api.openai.com directly):

```javascript
const openaiInstance = new OpenAI({
  apiKey: process.env.SUMOPOD_API_KEY,  // NOT OPENAI_API_KEY
  baseURL: process.env.AI_BASE_URL,     // Custom OpenAI-compatible base URL
});

const model = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";
```

### System Prompt

Injected verbatim into every new chat session via `getSession(sessionId)`:

```
You are an agentic travel assistant for TiketQ. You can search flights, ferries, check bookings, and execute bookings/payments.

CURRENT DATE CONTEXT:
- Today: {today's ISO date — injected at runtime}
- Tomorrow: {tomorrow's ISO date — injected at runtime}
- Current Year: {current year — injected at runtime}

If the user says 'tomorrow', use the Tomorrow date exactly. If they say 'May 31', append the Current Year to it. Do not claim you cannot determine the date.

Airport code mappings (use automatically, never ask the user):
- Jakarta -> CGK (or HLP)
- Batam -> BTH
- Bali -> DPS
- Singapore -> SIN

You DO NOT need to ask for passenger details to search for flights. Assume 1 adult by default.

CRITICAL RULE: DO NOT list the flight/ferry options in your text response. A rich UI card will automatically render in the chat. Simply acknowledge: "Here are the best schedules I found. Please select one of the cards below."
CRITICAL RULE: Always reply in the SAME language the user is using.
CRITICAL RULE: Do NOT ask the user for cheapest/earliest/latest preference. Default to 'all'.
CRITICAL RULE: If no flights found, explicitly state the origin, destination, and date. Example: "There are no flights found for tomorrow from BTH to CGK. Would you like to try another date?"
CRITICAL RULE: When user wants to book, collect conversationally: Full Name, Email, Phone, Date of Birth (+ Passport details for Ferry). Do NOT tell them to fill out a form.
STRICT GUARDRAIL: You are STRICTLY a travel assistant for TiketQ. Do NOT answer questions about any topic outside flights, ferries, and TiketQ services.
```

### Session Storage

Sessions are stored in-memory as a `Map<sessionId, messages[]>`. **They are NOT persisted to DB or Redis.** If the server restarts, all chat histories are lost.

`sessionId` is generated client-side: `session-${Math.random().toString(36).substring(2, 9)}`

---

## AI Tool Definitions (all 8 tools)

### 1. `search_flights`
Posts to `POST /api/flight/search`. Returns `chat:tool_result` with `type: "flight_results"`.
```json
{
  "name": "search_flights",
  "parameters": {
    "departure": "string — Airport code e.g. CGK",
    "arrival": "string — Airport code e.g. DPS",
    "departureDate": "string — YYYY-MM-DD",
    "returnDate": "string — optional, for round-trip",
    "adult": "integer — defaults to 1",
    "highlight_preference": "enum: cheapest | earliest | latest | all | none"
  },
  "required": ["departure", "arrival", "departureDate"]
}
```

### 2. `search_cheapest_flight_in_range`
Fires **up to 14 parallel** `POST /api/flight/search` calls (one per day). Limited to 14-day range.
```json
{
  "name": "search_cheapest_flight_in_range",
  "parameters": {
    "departure": "string",
    "arrival": "string",
    "startDate": "string — YYYY-MM-DD",
    "endDate": "string — YYYY-MM-DD",
    "adult": "integer",
    "highlight_preference": "enum: cheapest | earliest | latest | all | none"
  },
  "required": ["departure", "arrival", "startDate", "endDate"]
}
```

### 3. `search_ferry_trips`
Calls `GET /api/ferry/trips/search`. Returns `chat:tool_result` with `type: "ferry_results"`.
```json
{
  "name": "search_ferry_trips",
  "parameters": {
    "origin": "string — Port code e.g. BTC",
    "destination": "string — Port code e.g. HFC",
    "departureDate": "string — YYYY-MM-DD",
    "adult": "integer",
    "highlight_preference": "enum: cheapest | earliest | latest | all | none"
  },
  "required": ["origin", "destination", "departureDate", "adult"]
}
```

### 4. `execute_flight_booking`
Posts to `POST /api/flight/book`. AI must collect all passenger data conversationally first.  
On success → emits `chat:tool_result` with `type: "booking_summary"`.
```json
{
  "name": "execute_flight_booking",
  "parameters": {
    "searchId": "string — from the selected flight card",
    "adult": "integer",
    "child": "integer",
    "infant": "integer",
    "buyer": {
      "name": "string",
      "email": "string",
      "mobile_number": "string",
      "telp_number": "string — defaults to mobile_number"
    },
    "passengers": {
      "adults": [{
        "title": "enum: MR | MRS | MS | MSTR | MISS",
        "first_name": "string",
        "last_name": "string",
        "date_of_birth": "string — YYYY-MM-DD"
      }],
      "children": [],
      "infants": []
    }
  },
  "required": ["searchId", "adult", "buyer", "passengers"]
}
```

### 5. `execute_ferry_booking`
Posts to `POST /api/ferry/booking`. Passport data is **required** for Sindo Ferry international routes.  
On success → emits `chat:tool_result` with `type: "booking_summary"`.
```json
{
  "name": "execute_ferry_booking",
  "parameters": {
    "tripId": "string — from the selected ferry card",
    "origin": "string",
    "destination": "string",
    "departDate": "string — YYYY-MM-DD",
    "buyer": {
      "name": "string",
      "email": "string",
      "mobile_number": "string"
    },
    "passengers": {
      "adults": [{
        "title": "string",
        "first_name": "string",
        "last_name": "string",
        "date_of_birth": "string — YYYY-MM-DD",
        "passport_number": "string",
        "passport_issue_date": "string — YYYY-MM-DD",
        "passport_expiry_date": "string — YYYY-MM-DD",
        "passport_issuing_country": "string",
        "nationality": "string"
      }]
    }
  },
  "required": ["tripId", "origin", "destination", "departDate", "buyer", "passengers"]
}
```

### 6. `generate_dana_payment`
Posts to `POST /api/dana/create-order` with `{ bookingNo: bookingCode, payMethod }`. The amount is always derived server-side from the stored booking (the chat never supplies it).  
On success → emits `chat:tool_result` with `type: "dana_payment"`, `data: { bookingCode, kind, vaNumber, qrContent, expiryTime }`.
```json
{
  "name": "generate_dana_payment",
  "parameters": {
    "bookingCode": "string",
    "payMethod": "enum: QRIS | BCA | BNI | BRI | MANDIRI — defaults to QRIS if omitted"
  },
  "required": ["bookingCode"]
}
```
> **Note:** the tool's `payMethod` enum (`QRIS`/`BCA`/…) predates the current `PAY_METHOD_MAP`, which only accepts `DANA`, `BNI`, `BRI`, `MANDIRI`, `CIMB`, `PANIN` (see `docs/DANA_INTEGRATION.md`). `QRIS`/`BCA` are rejected by `POST /api/dana/create-order` with `400`.

### 7. `get_booking_info`
Calls `GET /api/flight/book-info/:bookingCode`.  
Emits `chat:tool_result` with `type: "booking_summary"`.
```json
{
  "name": "get_booking_info",
  "parameters": {
    "bookingCode": "string"
  },
  "required": ["bookingCode"]
}
```

### 8. `show_customer_service`
No parameters. Emits `chat:tool_result` with `type: "customer_service_card"`, `data: {}`.  
Renders a static WhatsApp card linking to `wa.me/6282382709777`.

---

## The Agentic Loop (`processMessage`)

```javascript
async processMessage(sessionId, messageText, socket) {
    const messages = this.getSession(sessionId);
    messages.push({ role: "user", content: messageText });

    socket.emit("chat:typing");

    let response = await openai.chat.completions.create({
        model, messages, tools, tool_choice: "auto"
    });

    let responseMessage = response.choices[0].message;

    // Keeps re-running until LLM produces no more tool_calls
    while (responseMessage.tool_calls) {
        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
            // handleToolCall emits a chat:tool_result socket event, then returns
            // a JSON-stringified string that goes back into the LLM messages array
            const functionResult = await this.handleToolCall(toolCall, socket);
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: functionResult
            });
        }

        socket.emit("chat:typing");
        response = await openai.chat.completions.create({ model, messages, tools, tool_choice: "auto" });
        responseMessage = response.choices[0].message;
    }

    messages.push(responseMessage);
    socket.emit("chat:response_done", { content: responseMessage.content });
}
```

---

## Socket Events Reference

### Events: Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:typing` | _(none)_ | LLM inference started. Frontend shows typing dots. |
| `chat:response_done` | `{ content: string }` | LLM finished. Markdown text appended to chat. |
| `chat:tool_result` | See types below | Rich UI card rendered in chat. |
| `chat:error` | `{ message: string }` | Unhandled LLM API error. |
| `booking:update` | `{ bookingNo: string }` | Payment webhook succeeded. Triggers `EticketContainer` refetch. |
| `visitors_update` | `{ activeVisitors: number }` | Active visitor count changed. |

### `chat:tool_result` Payload Types

```typescript
type ChatToolResult =
  | { type: 'flight_results';       data: FlightResultsData }
  | { type: 'ferry_results';        data: FerryResultsData }
  | { type: 'booking_summary';      data: BookingSummaryData }
  | { type: 'dana_payment';         data: DanaPaymentData }
  | { type: 'customer_service_card'; data: {} }

type FlightOption = {
  searchId: string;        // Used by execute_flight_booking
  airline: string;
  departDate: string;      // DD-MM-YYYY
  departTime: string;      // HH:MM
  arriveTime: string;      // HH:MM
  price: number;           // IDR
  isTransit: boolean;
  duration: string;
}

type FerryOption = {
  tripId: string;          // Used by execute_ferry_booking
  ferryName: string;
  departureTime: string;   // HH:MM
  departTime: string;      // Alias for sort logic
  arrivalTime: string;
  seatAvailable: number;
  price: number;           // IDR
}

type FlightResultsData = { options?: FlightOption[]; cheapest?: FlightOption; earliest?: FlightOption; latest?: FlightOption; message?: string; }
type FerryResultsData  = { options?: FerryOption[];  cheapest?: FerryOption;  earliest?: FerryOption;  latest?: FerryOption;  message?: string; }

type BookingSummaryData = {
  bookingCode: string;
  status: string;          // "ISSUED" | "PENDING"
  flightdetail?: [{ depart: string; origin: string; arrival: string; destination: string; }];
  error?: string;          // If set, renders a red error card
}

type DanaPaymentData = {
  bookingCode: string;
  kind: string;            // "VA" | "REDIRECT"
  vaNumber: string | null; // virtual-account number (VA methods)
  qrContent: string | null;
  expiryTime: string;
}
```

### Events: Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:message` | `{ sessionId: string; text: string; }` | User sends a message to the AI. |
| `visitor_connected` | _(none)_ | Increments active visitor counter. |
| `disconnect` | _(none)_ | Decrements active visitor counter. |
