# 📡 API Reference

The TiketQ Bosbiller API is organized into several modules. For interactive documentation, use the **Swagger UI** available at `/api-docs` when the server is running.

## 🔐 Authentication & Authorization

All protected routes require a JWT (JSON Web Token) in the request header:
`Authorization: Bearer <your_jwt_token>`

### Middleware
- `ensure-token.js`: Validates that a valid JWT is present.
- `ensure-admin.js`: Ensures the authenticated user has administrative privileges.

---

## 🔑 Auth API (`/api/auth`)
Handles user registration, login, and profile management.

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register a new user | No |
| `/api/auth/login` | `POST` | Authenticate and get JWT | No |
| `/api/auth/users` | `GET` | List all users | Admin |
| `/api/auth/me` | `GET` | Get current user profile | User |

## ✈️ Flight API (`/api/flight`)
Flight search, details, and booking management.

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/flight/airlines` | `GET` | List supported airlines | No |
| `/api/flight/search` | `POST` | Search for available flights | No |
| `/api/flight/booking` | `POST` | Create a new flight booking | User |
| `/api/flight/bookings` | `GET` | List user bookings | User |

## ⛴️ Ferry API (`/api/ferry`)
Integration with Sindo Ferry for trips and ticketing.

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/ferry/master/sectors` | `GET` | List ferry sectors | User |
| `/api/ferry/trips/search` | `GET` | Search for ferry trips | User |
| `/api/ferry/booking` | `POST` | Reserve a ferry booking | User |
| `/api/ferry/order/:id/print` | `GET` | Generate an order printout | User |

## 🚗 Car Rental API (`/api/car-rental`)
Car inventory and booking requests.

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/car-rental/cars` | `GET` | List available cars | No |
| `/api/car-rental/request` | `POST` | Submit a rental request | No |

---

## 🛠️ Common Usage Patterns

### Error Responses
Generic error response format:
```json
{
  "error": "Message describing the error",
  "status": 400
}
```

### Adding a New Route
To add a new route:
1. Define the handler in `routes/api/<module>/`.
2. Register the route in `routes/api/index.js` or `routes/protectedRoutes.js`.
3. Update `swagger.yaml` to include the new endpoint.
