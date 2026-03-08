# TiketQ Bosbiller API Specifications

This document provides a high-level overview of the TiketQ Bosbiller API architecture, data models, and conventions.

## Architecture

The API is built using Node.js and Express, with PostgreSQL as the primary relational database (managed via Prisma ORM). Redis is used for caching search results and static data like airlines and airports.

### Base URL

- Development: `http://localhost:3000/api`
- Production: (Defined by deployment environment)

## Core Components

- **Database**: PostgreSQL with Prisma ORM for type-safe database access and migrations.
- **Authentication**: JWT-based authentication. Use the `/api/auth` endpoint to obtain a token.
- **Service Integration**: Communicates with external flight provider APIs via a centralized `ApiService`.
- **Payment Gateway**: Integration with Midtrans for payment processing.
- **Caching**: 24-hour cache for airline/airport lists; 30-minute cache for flight searches.

## Data Models (Prisma)

### User

- `id`: Int (Auto-increment, Primary Key)
- `username`: String (Unique)
- `password`: String (Hashed)
- `isAdmin`: Boolean
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Flight Booking

- `id`: Int (Auto-increment, Primary Key)
- `bookingCode`: String
- `nominal`: String
- `departureDate`: String
- `origin`: String
- `destination`: String
- `mobile_number`: String
- `name`: String
- `book_date`: DateTime
- `payment_status`: Boolean
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Success
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Generic server error

## API Documentation

For interactive documentation, start the server and visit:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)
