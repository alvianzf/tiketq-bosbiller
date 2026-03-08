# TiketQ Bosbiller API Specifications

This document provides a high-level overview of the TiketQ Bosbiller API architecture, data models, and conventions.

## Architecture

The API is built using Node.js and Express, with PostgreSQL as the primary relational database (managed via Prisma ORM). Redis is used for caching.

### Base URL

- Development: `http://localhost:3000/api`

### Domain Structure

- **Flight Domain** (`/api/flight`): Handles airports, airlines, flight search, and booking management.
- **Auth Domain** (`/api/auth`): Handles user registration, login, and user profile management.
- **Payment Domain** (`/api/payment`): Handles payment processing and Midtrans integration.
- **Ferry Domain** (`/api/ferry`): Placeholder for upcoming ferry service integration.

## Core Components

- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: JWT-based authentication.
- **Caching**: Redis-based caching for frequent data.

## API Endpoints Overview

### Flight API

- `GET /api/flight/airlines`: List all airlines.
- `GET /api/flight/airports`: List all airports.
- `POST /api/flight/search`: Search for available flights.
- `POST /api/flight/book`: Create a new flight booking.
- `GET /api/flight/book-info/:code`: Get booking details by code.
- `GET /api/flight/search-airport/:query`: Search airports by name/code.
- `GET /api/flight/bookings`: List all bookings (Requires Auth).

### Auth API

- `POST /api/auth`: User login.
- `POST /api/auth/register`: User registration.
- `POST /api/auth/admin-login` - Admin login endpoint
- `GET /api/auth/me` - Get current user profile (Protected)
- `POST /api/auth/admin-register`: Admin registration (Requires Auth).
- `GET /api/auth/users`: List all users (Requires Auth).

### Payment API

- `POST /api/payment`: Process payment for a booking.
- `POST /api/payment/midtrans`: Generate Midtrans payment token.

### Ferry API

- `GET /api/ferry/ports`: List ports (Requires Auth).
- `GET /api/ferry/sectors`: List sectors (Requires Auth).
- `POST /api/ferry/trips/search`: Search ferry trips (Requires Auth).
- `POST /api/ferry/booking/reserve`: Reserve a booking (Requires Auth).
- `POST /api/ferry/booking/confirm`: Confirm a booking (Requires Auth).
- `GET /api/ferry/booking/:id`: Get booking by ID (Requires Auth).

## Data Models (Prisma)

Refer to [prisma/schema.prisma](file:///Users/azfaturrahman/Projects/tiketq/tiketq-bosbiller/prisma/schema.prisma) for detailed schema definitions.

## Error Handling

The API utilizes standard HTTP status codes (200, 201, 400, 401, 403, 404, 500).

## API Documentation

Interactive documentation via Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
