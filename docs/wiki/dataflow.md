# 🔄 Flight & Ferry Booking Dataflow

This document describes the complete end-to-end dataflow and transactional lifecycle for both **Flight** and **Ferry** bookings within the TiketQ Bosbiller ecosystem.

---

## ✈️ Flight Booking Lifecycle & Dataflow

Flight bookings utilize direct provider API channels integrated with our local transaction store and Midtrans payment checkout gateways.

### Flowchart: End-to-End Flight Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Client
    participant API as routes/api/flight/
    participant DAO as db/dao/FlightBookingDAO
    participant DB as PostgreSQL
    participant Provider as Flight External API
    participant Midtrans as Midtrans Payment Gateway
    participant Webhook as routes/webhooks/index.js
    participant Service as services/pdfService & emailService

    Client->>API: 1. Request Availability & Search
    API->>Provider: Query Flight schedules
    Provider-->>API: Return schedule options
    API-->>Client: Render schedules
    
    Client->>API: 2. Create Booking (Passenger Details)
    API->>DAO: Store FlightBooking & Passengers
    DAO->>DB: INSERT into flight_bookings (Status: PENDING)
    API->>Provider: Reserve Seats with Provider (Holding PNR)
    Provider-->>API: Return PNR Code
    API->>Midtrans: Request Payment Token
    Midtrans-->>API: Return Transaction Token & Redirect URL
    API-->>Client: Return Token & PNR
    
    Client->>Midtrans: 3. Make Payment
    Midtrans->>Webhook: 4. POST Status Notification (settlement)
    
    rect rgb(255, 247, 237)
        note right of Webhook: Webhook payment settlement processing
        Webhook->>Provider: Issue/Confirm Flight Ticket (capture payment)
        Provider-->>Webhook: Ticket Confirmed & Ticket Numbers Issued
        Webhook->>DAO: Update Payment Status & Save Ticket Numbers
        DAO->>DB: UPDATE flight_bookings (payment_status: true)
        
        Webhook->>Service: Trigger Ticket Compilation (async)
        Service->>Service: Generate E-Ticket PDF & Invoice PDF
        Service->>Service: Encode PNR in Master QR Code
        Service->>Service: Dispatch Email with Attachments
    end
    Webhook-->>Midtrans: 200 OK Response
```

### Detailed Flight Dataflow Steps

1.  **Search & Pricing**: The user searches flights via `routes/api/flight/search/index.js`. Real-time inventory and pricing are retrieved upstream from the external Flight API.
2.  **Booking Creation (Pending)**: The user submits passenger details to `routes/api/flight/book/index.js`.
    -   The system persists a new `FlightBooking` record and associated `Passenger` and `Transaction` records in the local database with `status: "PENDING"` via `FlightBookingDAO`.
    -   A temporary holding seat reservation is booked upstream.
    -   A checkout payload is dispatched to Midtrans, returning a secure payment token and redirect URL.
3.  **Payment Capture & Webhook Settlement**: The customer settles their bill on the Midtrans gateway. Midtrans dispatches a webhook to `routes/webhooks/index.js`.
    -   **Provider Issuance**: If the transaction is approved (`settlement` or `capture`), the webhook initiates an upstream `payment` issue request via `apiService.fetchData()` to lock in the actual flight tickets.
    -   **DB Commit**: The system updates `payment_status` to `true` in PostgreSQL.
    -   **PDF Generation**: Under `services/pdfService.js`, an A4 Flight E-ticket PDF and a professional invoice PDF are dynamically compiled. The master QR code on the top-right of the E-ticket encodes the unique flight booking PNR.
    -   **Email Dispatch**: In `services/emailService.js`, the ticket PDF and Invoice PDF are attached, and a gorgeous HTML confirmation email is dispatched to the user.

---

## 🚢 Ferry Booking (Sindo Ferry) Lifecycle & Dataflow

Ferry bookings utilize the official Sindo Ferry merchant adapter integrated with localized caching, parallel processing, and individual passenger QR voucher code mapping.

### Flowchart: End-to-End Ferry Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Client
    participant API as routes/api/ferry/
    participant Cache as utils/ferryCache
    participant DAO as db/dao/FerryBookingDAO
    participant DB as PostgreSQL
    participant Sindo as Sindo Ferry API
    participant Midtrans as Midtrans Payment Gateway
    participant Webhook as routes/webhooks/index.js
    participant Service as services/ferryPdfService & emailService

    Client->>API: 1. Request Availability & Search
    API->>Cache: Check for active search cache
    alt Cache Miss
        API->>Sindo: Query Trips via GET /Trips/GetTripWeb
        Sindo-->>API: Return raw trip schedules
        API->>Cache: Set cache (expires in 5 mins)
    else Cache Hit
        Cache-->>API: Return cached trip options
    end
    API-->>Client: Render schedules (optimized)
    
    Client->>API: 2. Create Booking (Passenger Details)
    API->>DAO: Store FerryBooking & Passengers
    DAO->>DB: INSERT into ferry_bookings (Status: PENDING)
    API->>Sindo: POST /Agent/Booking/Bookings (Hold Booking)
    Sindo-->>API: Return Sindo booking number (bookingNo)
    API->>Sindo: Parallel POST Details for Passengers (Promise.all)
    Sindo-->>API: Confirm passenger registration
    API->>Midtrans: Request Payment Token
    Midtrans-->>API: Return Transaction Token & Redirect URL
    API-->>Client: Return Token & bookingNo
    
    Client->>Midtrans: 3. Make Payment
    Midtrans->>Webhook: 4. POST Status Notification (settlement)
    
    rect rgb(255, 247, 237)
        note right of Webhook: Webhook payment settlement processing
        Webhook->>DAO: Set local payment status to PAID
        DAO->>DB: UPDATE ferry_bookings & transactions
        
        Webhook->>Sindo: 5. Fetch Vouchers via GET .../WithVoucherIssuance
        Sindo-->>Webhook: Return List of Passenger Voucher GUIDs
        Webhook->>DAO: 6. Store unique voucherCodeId per Passenger
        DAO->>DB: UPDATE passengers (voucherCodeId = GUID)
        
        Webhook->>Service: 7. Trigger E-Ticket Compilation (async)
        Service->>Service: Generate E-Ticket PDF with Multi-Passenger QRs
        Service->>Service: Compile Email with individual inline QR attachments
        Service->>Service: Send Email to Passenger
    end
    Webhook-->>Midtrans: 200 OK Response
```

### Detailed Ferry Dataflow Steps

1.  **Search & Caching**: The user queries ferry schedules via `routes/api/ferry/trips/index.js`.
    -   The system checks the memory cache via `utils/ferryCache.js` for key `trips:${embarkation}:${destination}:${date}`.
    -   If a cache miss occurs, the system makes a secure API request to Sindo Ferry's `/Trips/GetTripWeb` endpoint, parses and normalizes the payload, and caches the result for 5 minutes.
2.  **Booking Creation (Pending)**: The user submits passenger metadata and passport details to `routes/api/ferry/booking/index.js`.
    -   **Parallel Master Loading**: Available sectors and country GUID lists are fetched concurrently via `Promise.all` utilizing cache lookups to fuzzy-match and normalize passenger details.
    -   **Local DB Persistence**: A new `FerryBooking` record, its related `Passenger` records, and a transaction row are committed to the local database with a status of `PENDING` via `FerryBookingDAO`.
    -   **Ferry Booking Submission**: A `POST` request is sent to Sindo Ferry's `/Agent/Booking/Bookings` endpoint to create a temporary holding ticket.
    -   **Parallel Passenger Registration**: Sindo Ferry requires a separate `POST` request for each passenger's passport/metadata detail. To avoid $N \times 1.5\text{s}$ consecutive latencies, these requests are dispatched concurrently using `Promise.all`.
    -   **Payment Token Generation**: The service issues a checkout token from Midtrans and returns it along with the official `bookingNo` to the frontend client.
3.  **Payment Capture & Webhook Settlement**: The user pays via Midtrans, which triggers a status POST to `routes/webhooks/index.js`.
    -   **DB Status Update**: The handler sets the booking and transaction statuses to `PAID` via `FerryBookingDAO.updatePaymentStatusByNo()`.
    -   **Passenger Voucher Issuance**: To fetch the official individual passenger ticket codes, the system calls Sindo Ferry's `GET /agent/Order/Orders/{bookingNo}/WithVoucherIssuance` API.
    -   **Sequential Mapping**: The external API returns an array of passenger ticket vouchers in the exact sequential order of their registration index. The handler loops through the passengers array, maps `vouchers[i].voucherCodes[0].id` to `passengers[i]`, and writes the unique GUID string to the `voucherCodeId` column in the database via `FerryBookingDAO.updatePassengerVoucher()`.
4.  **Multi-QR E-Ticket PDF Rendering**:
    -   The E-ticket generator in `services/ferryPdfService.js` compiles a professional, orange-branded A4 voucher.
    -   **Master QR Code**: The top-right master QR code encodes the first passenger's unique `voucherCodeId` (falling back to the general `bookingNo` if undefined).
    -   **Individual Table Row QR Codes**: Inside the passenger details table, a custom column displays a 35x35 QR code generated on the fly for *each* passenger row, encoding their respective unique voucher GUID (`voucherCodeId`).
5.  **Multi-QR Email Notification**:
    -   The email service in `services/emailService.js` generates passenger-specific inline QR code data attachments with matching Content IDs: `qrcode-pax-${i}@tiketq.com`.
    -   The HTML template renders individual QR code attachments inside the Passenger details table row next to passport/nationality details, and places the first passenger's unique voucher ID inside the header QR code.
    -   The email is sent asynchronously with both the E-ticket and Invoice PDFs attached.

---

## 🔍 Unified Search & Retrieval Gateway Flow

To support rapid, unified lookup of both flight and ferry bookings using a single search input, a centralized adapter flow is established in `routes/api/flight/bookinfo/index.js`.

```mermaid
graph TD
    A[Client Search: /api/flight/book-info/:code] --> B{Check Flight Database}
    B -- Found --> C[Format Flight JSON]
    B -- Not Found --> D{Check Ferry Database}
    
    D -- Found Ferry Booking --> E[Generate Ferry E-Ticket PDF on-the-fly]
    E --> F[Adapt Ferry Model to Flight-compatible JSON Adapter]
    F --> G[Return Adapter JSON with base64 PDF to Client]
    
    D -- Not Found --> H[Return 404 Error]
```

### Detailed Search Adapter Dataflow

1.  **Unified Input Endpoint**: The frontend calls a single endpoint: `GET /api/flight/book-info/:code`.
2.  **Flight Lookup**: The controller checks PostgreSQL via `FlightBookingDAO`. If found, it returns the standard flight booking structure.
3.  **Ferry Lookup & Dynamic Transformation**: If no flight matches the search query:
    -   The controller queries PostgreSQL using `FerryBookingDAO.findBookingByNo()`.
    -   If a ferry booking is found, the system invokes `generateFerryTicketPDF()` on-the-fly to render the latest multi-QR code A4 document.
    -   The system maps the relational ferry database properties (origin, destination, date, passengers, transaction metadata) into a flight-structured interface (e.g. mapping `bookingNo` to `bookingCode` and embedding the passenger details).
    -   The adapted JSON, containing the base64-encoded PDF buffer under a standard key, is returned to the client.
4.  **Client Render**: The React frontend renders the standard travel eticket display and provides an immediate PDF download button without requiring any frontend code changes.
