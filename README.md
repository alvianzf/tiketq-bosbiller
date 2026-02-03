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
- **MongoDB**: Local or remote instance
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
   - `DB_NAME`: Your MongoDB database name.
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

Below is a detailed description of the core APIs available in our system.

### List of APIs

1. [Get Airlines](#get-airlines)
2. [Get Airports](#get-airports)
3. [Search Flights](#post-search-flights)
4. [Book Flights](#post-book-flights)
5. [Get Booking Information](#get-get-booking-information)
6. [Search Airport](#get-search-airport)

---

### `GET` Airlines

This endpoint returns a list of all airlines.

**Request:**

```http
GET /airlines
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

This endpoint returns a list of all airports.

**Request:**

```http
GET /airports
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

This endpoint allows you to search for flights.

**Request:**

```http
POST /search
```

**Body**

```json
{
  "departure": "CGK", // IATA code of departure airport (e.g., CGK for Soekarno-Hatta)
  "arrival": "SIN", // IATA code of arrival airport (e.g., SIN for Changi)
  "departureDate": "2025-07-01", // Date of departure in YYYY-MM-DD format
  "returnDate": "2025-07-10", // Date of return (for round trip), optional for one-way
  "adult": 1, // Number of adult passengers (age 12+)
  "child": 0, // Number of children (age 2–11)
  "infant": 0 // Number of infants (under 2 years)
}
```

**Response:**

```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": [
    {
      "classes": [
        ...
      ],
      "title": "...",
      "isTransit": false,
      "detailTitle": [
        ...
      ],
      "cityTransit": "",
      "departureDate": "...",
      "arrivalDate": "...",
      "duration": "...",
      "airlineIcon": "...",
      "airlineName": "...",
      "airlineCode": "...",
      "searchId": "..."
    },
    ...
  ]
}
```

---

### `POST` Book Flights

This endpoint allows you to book flights.

**Request:**

```http
POST /book
```

**Body**
```json
{
  "searchId": "e8a2956a62afa415d8d9c1f307287ef7ba69b0a6",
  "adult": "1",
  "child": "0",
  "infant": "0",
  "buyer": {
    "telp_number": "123123",
    "mobile_number": "123123",
    "email": "12323!@sds.com"
  },
  "passengers": {
    "adults": [
      {
        "title": "Mr",
        "first_name": "12",
        "last_name": "123",
        "date_of_birth": "06/18/2025"
      }
    ],
    "childrens": [],
    "infants": []
  }
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

This endpoint allows you to get booking information.

**Request:**

```http
GET /book-info/:code
```

**Body**

```json
{
  "bookingCode": "RUEHS"
}
```
**Response:**
```json
{
  "rc": "00",
  "msg": "Sukses",
  "data": {
    ...
  }
}
```

---

### `GET` Search Airport

This endpoint allows you to search for an airport by code or name.

**Request:**

```http
GET /search-airport/:query
```

**Response:**

```json
{
  "data": [
    {
      "code": "...",
      "name": "...",
      "bandara": "...",
      "group": "..."
    }
  ]
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
