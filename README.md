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

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd tiketq-bosbiller
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment file and update the variables.
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/db_name`).
   - `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY`: Your payment gateway keys.
   - `CORS_ORIGIN`: Allowed origins (e.g., `http://localhost:5173`).

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

## 📚 API Reference

Detailed API documentation is available in the following formats:

- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (when server is running)
- **API Specifications**: [API_SPECS.md](./API_SPECS.md)

### List of APIs

1. [Get Airlines](#get-airlines)
2. [Get Airports](#get-airports)
3. [Search Flights](#post-search-flights)
4. [Book Flights](#post-book-flights)
5. [Get Booking Information](#get-get-booking-information)
6. [Search Airport](#get-search-airport)

---

### `GET` Airlines

**Request:**

```http
GET /api/airlines
```

**Response:**

```json
{
    "rc": "00",
    "msg": "sukses",
    "data": [
        {
            "airlineCode": "XXX",
            "airlineName": "Airline 1"
        },
        ...
    ]
}
```

---

### `GET` Airports

**Request:**

```http
GET /api/airports
```

**Response:**

```json
{
    "rc": "00",
    "msg": "sukses",
    "data": [
        {
            "code": "XXX",
            "name": "Airport 1",
            "bandara": "Bandara 1",
            "group": "Domestik"
        },
        ...
    ]
}
```

---

### `POST` Search Flights

**Request:**

```http
POST /api/search
```

**Body**

```json
{
  "departure": "CGK",
  "arrival": "SIN",
  "departureDate": "2025-07-01",
  "returnDate": "2025-07-10",
  "adult": 1,
  "child": 0,
  "infant": 0
}
```

**Response:**

```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": [
    ...
  ]
}
```

---

### `POST` Book Flights

**Request:**

```http
POST /api/book
```

**Body**

```json
{
  "searchId": "...",
  "buyer": { ... },
  "passengers": { ... }
}
```

**Response:**

```json
{
  "bookingCode": "RUEHS"
}
```

---

### `GET` Get Booking Information

**Request:**

```http
GET /api/book-info/:code
```

**Response:**

```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": { ... }
}
```

---

### `GET` Search Airport

**Request:**

```http
GET /api/search-airport/:query
```

**Response:**

```json
{
  "data": [ ... ]
}
```

## 📂 Project Structure

- `bin/`: Server entry point.
- `routes/`: API route definitions.
- `db/`: Database models and connection logic.
- `middleware/`: Custom Express middleware (error handling, auth).
- `services/`: Business logic.
- `utils/`: Utility functions.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
