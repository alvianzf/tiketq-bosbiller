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

There you can explore all endpoints, including:
- `GET /api/airlines`
- `GET /api/airports`
- `POST /api/search`
- `POST /api/book`
- ...and more.

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

[License Name] - see the LICENSE file for details.
