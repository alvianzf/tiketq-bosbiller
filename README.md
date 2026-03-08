# TiketQ Bosbiller API

Welcome to the **TiketQ Bosbiller API**. This service handles flight searches, bookings, and user management for the TiketQ platform.

## 🚀 Features

- **Flight Search & Booking**: Real-time flight availability and booking.
- **Airport & Airline Data**: Comprehensive database of airports and airlines.
- **User Management**: Authentication and user profile management.
- **Payments**: Integration with Midtrans for secure payments.
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
2.  [Get Airports](#get-airports) - `GET /api/flight/airports`
3.  [Search Flights](#post-search-flights) - `POST /api/flight/search`
4.  [Book Flights](#post-book-flights) - `POST /api/flight/book`
5.  [Get Booking Info](#get-booking-info) - `GET /api/flight/book-info/:code`
6.  [Search Airport](#get-search-airport) - `GET /api/flight/search-airport/:query`
7.  [List Bookings](#list-bookings) - `GET /api/flight/bookings` (Protected)

### Auth API (`/api/auth`)

1.  [Login](#login) - `POST /api/auth`
2.  [Register](#register) - `POST /api/auth/register`
3.  [Get Current User](#get-current-user) - `GET /api/auth/me` (Protected)
4.  [Admin Login](#admin-login) - `POST /api/auth/admin-login`
5.  [User List](#user-list) - `GET /api/auth/users` (Protected)

### Payment API (`/api/payment`)

1.  [Process Payment](#payment) - `POST /api/payment`
2.  [Get Token](#midtrans-token) - `POST /api/payment/midtrans`

### Ferry API (`/api/ferry`)

1.  [Get Ports](#ports) - `GET /api/ferry/ports` (Protected)
2.  [Search Trips](#search-trips) - `POST /api/ferry/trips/search` (Protected)
3.  [Reserve Booking](#reserve-booking) - `POST /api/ferry/booking/reserve` (Protected)

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
- `routes/api/`: Domain-based route definitions (flight, auth, payment).
- `db/`: Database configuration and seeds (Prisma/PostgreSQL).
- `middleware/`: Custom Express middleware.
- `services/`: Business logic.
- `utils/`: Utility functions.

## 🤝 Contributing

Contributions are welcome!

## 📄 License

MIT License.
