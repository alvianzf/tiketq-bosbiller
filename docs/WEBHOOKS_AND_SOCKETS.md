# Webhooks & Socket.io

Derived from `socket.js`, `routes/webhooks/index.js`, and `services/chatService.js`.

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

## Midtrans Webhook (`routes/webhooks/index.js`)

**Endpoint:** `POST /webhooks/midtrans`  
Called asynchronously by Midtrans after payment is captured/settled.

**Midtrans sends:**
```json
{
  "order_id": "ORDER-ABCDEF-1716800000",
  "transaction_status": "settlement",
  "gross_amount": "750000.00"
}
```

**Logic flow:**
1. Parses `order_id` to determine service type.
2. If `order_id.startsWith("ferry-")` → updates `FerryBooking.payment_status = true` via `FerryBookingDAO`.
3. Otherwise → issues flight ticket to provider, updates `FlightBooking.payment_status = true`.
4. On either success path, emits `booking:update` via Socket.io.

```javascript
const io = require('../../socket').getIo();
io.emit("booking:update", { bookingNo: bookingCode });
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

### 6. `generate_midtrans_payment`
Builds `order_id` as `ORDER-{bookingCode}-{unix_timestamp}`. Posts to `POST /api/flight/payment/midtrans`.  
On success → emits `chat:tool_result` with `type: "qris_payment"`, `data: { bookingCode, amount, token }`.
```json
{
  "name": "generate_midtrans_payment",
  "parameters": {
    "bookingCode": "string",
    "amount": "number — in IDR",
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "required": ["bookingCode", "amount"]
}
```

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
| `visitors_update` | `{ count: number }` | Active visitor count changed. |

### `chat:tool_result` Payload Types

```typescript
type ChatToolResult =
  | { type: 'flight_results';       data: FlightResultsData }
  | { type: 'ferry_results';        data: FerryResultsData }
  | { type: 'booking_summary';      data: BookingSummaryData }
  | { type: 'qris_payment';         data: QrisPaymentData }
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

type QrisPaymentData = {
  bookingCode: string;
  amount: number;          // IDR
  token: string;           // Midtrans Snap token → window.snap.pay(token)
}
```

### Events: Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:message` | `{ sessionId: string; text: string; }` | User sends a message to the AI. |
| `visitor_connected` | _(none)_ | Increments active visitor counter. |
| `disconnect` | _(none)_ | Decrements active visitor counter. |
