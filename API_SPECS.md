# TiketQ Bosbiller API Specifications

This document provides a high-level overview of the TiketQ Bosbiller API architecture, data models, and conventions.

## Architecture

The API is built using Node.js and Express, with PostgreSQL as the primary relational database (managed via Prisma ORM). Redis is used for caching.

### Base URL

- Development: `http://localhost:3000/api`

### Domain Structure

- **Flight Domain** (`/api/flight`): Handles airports, airlines, flight search, booking management, and flight payments (including Midtrans).
- **Auth Domain** (`/api/auth`): Handles user registration, login, and user profile/account management.
- **Ferry Domain** (`/api/ferry`): Handles ferry port/sector listing, trip search, and booking management.

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
- `GET /api/flight/bookings`: List all flight bookings (Requires Auth).
- `GET /api/flight/booking-data`: List all flight booking raw records (Requires Auth).
- `POST /api/flight/payment`: Process payment for a flight booking (Requires Auth).
- `POST /api/flight/payment/midtrans`: Generate Midtrans payment token for flight (Requires Auth).

### Auth API

- `POST /api/auth/login`: User login.
- `POST /api/auth/register`: User registration.
- `GET /api/auth/me`: Get current user profile (Protected).
- `GET /api/auth/users`: List all users (Requires Auth).
- `GET /api/auth/users/:id`: Get user by ID (Requires Auth).

- `GET /api/ferry/agent/agents`: List ferry agents (Requires Auth).
- `GET /api/ferry/master/sectors`: List available ferry sectors (Requires Auth).
- `GET /api/ferry/master/routes`: List ferry routes (Requires Auth).
- `GET /api/ferry/trips/search`: Search available ferry trips (Requires Auth).
- `POST /api/ferry/booking`: Reserve a ferry booking (Requires Auth).
- `POST /api/ferry/booking/:id/details`: Add passenger details to booking (Requires Auth).
- `POST /api/ferry/booking/submit`: Submit a ferry booking (Requires Auth).
- `GET /api/ferry/booking/:id`: Get ferry booking details (Requires Auth).

## Data Models (Prisma)

Refer to [prisma/schema.prisma](file:///Users/azfaturrahman/Projects/tiketq/tiketq-bosbiller/prisma/schema.prisma) for detailed schema definitions.

## Error Handling

The API utilizes standard HTTP status codes (200, 201, 400, 401, 403, 404, 500).

## API Documentation

Interactive documentation via Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
