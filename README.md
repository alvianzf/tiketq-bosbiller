# TiketQ Bosbiller API

Welcome to the **TiketQ Bosbiller API**. This service handles flight searches, bookings, and user management for the TiketQ platform.

## 🚀 Features

- **Flight Search & Booking**: Real-time flight availability, booking, and payment.
- **Ferry Service**: Sindo Ferry API integration for real-time search and booking.
- **User Management**: Authentication and account management consolidated under Auth.
- **Payments**: Integrated Midtrans and direct flight payment services.
- **Swagger UI**: Interactive API documentation.

## 🛠️ Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: v14.x or higher
- **PostgreSQL**: v12 or higher
- **Redis** (Optional): For caching (if configured)

## 📦 Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd tiketq-bosbiller
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy the example environment file and update the variables.
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your credentials:
    - `DATABASE_URL`: Your PostgreSQL connection string.
    - `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY`: Your payment gateway keys.
    - `CORS_ORIGIN`: Allowed origins.

## 🏃‍♂️ Usage

### Development Mode

Run the server with hot-reload (if `nodemon` is available) or standard node:

```bash
npm start
```

The server defaults to port `3000`.

### API Documentation

Interactive API documentation is available via Swagger UI.
Once the server is running, visit:
**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

---

## 🔐 Authentication

All protected routes require a JSON Web Token (JWT). To authenticate, include the token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

You can obtain a token by logging in via:

- `POST /api/auth` (User)
- `POST /api/auth/admin-login` (Admin)

---

## 📚 API Reference

Detailed API documentation is available in the following formats:

- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **API Specifications**: [API_SPECS.md](./API_SPECS.md)

### Flight API (`/api/flight`)

1.  [Get Airlines](#get-airlines) - `GET /api/flight/airlines`
2.  [Search Flights](#post-search-flights) - `POST /api/flight/search`
3.  [List Bookings](#list-bookings) - `GET /api/flight/bookings` (Protected)
4.  [Process Payment](#payment) - `POST /api/flight/payment` (Protected)
5.  [Get Midtrans Token](#midtrans-token) - `POST /api/flight/payment/midtrans` (Protected)

### Auth API (`/api/auth`)

1.  [Login](#login) - `POST /api/auth/login`
2.  [Register](#register) - `POST /api/auth/register`
3.  [User List](#user-list) - `GET /api/auth/users` (Protected)

### Ferry API (`/api/ferry`)

1.  [Available Sectors](#sectors) - `GET /api/ferry/master/sectors` (Protected)
2.  [Search Trips](#search-trips) - `GET /api/ferry/trips/search` (Protected)
3.  [Reserve Booking](#reserve-booking) - `POST /api/ferry/booking` (Protected)
4.  [Passenger Details](#passenger-details) - `POST /api/ferry/booking/:id/details` (Protected)
5.  [Submit Booking](#submit-booking) - `POST /api/ferry/booking/submit` (Protected)
6.  [Order Printout](#order-print) - `GET /api/ferry/order/:id/print` (Protected)

---

### `GET` Airlines

**Request:**

```http
GET /api/flight/airlines
```

### `POST` Search Flights

**Request:**

```http
POST /api/flight/search
```

**Body**

```json
{
  "departure": "CGK",
  "arrival": "SIN",
  "departureDate": "2025-07-01",
  "adult": 1
}
```

## 📂 Project Structure

- `bin/`: Server entry point.
- `routes/api/flight/`: Consolidated flight routes (search, book, payment, bookings).
- `routes/api/ferry/`: Restructured ferry routes (agent, master, trips, booking).
- `routes/api/auth/`: Consolidated authentication and user routes.

## 🤝 Contributing

Contributions are welcome!

## 📄 License

MIT License.
