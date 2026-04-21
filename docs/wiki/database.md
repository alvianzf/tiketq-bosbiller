# 🗄️ Database Documentation

The project uses **Prisma** as the ORM and **PostgreSQL** as the primary relational database.

## 🗺️ Data Model (ERD)

The database schema is defined in `prisma/schema.prisma`. Below are the core models and their purposes.

### 1. User
Handles authentication and authorization.
- `id`: Primary Key (Autoincrement)
- `username`: Unique username for login.
- `password`: Hashed password (Bcrypt).
- `isAdmin`: Boolean flag for administrative privileges.

### 2. Transaction
The central model for all booking activities. Links to specific service bookings.
- `serviceType`: Enum (`FLIGHT`, `FERRY`, `CAR_RENTAL`).
- `bookingCode`: Unique identifier for the service provider.
- `payment_status`: Boolean indicator if payment is processed.
- `status`: String status (`PENDING`, `SUCCESS`, `CANCELLED`).
- `Relations`:
    - `flightBooking`: Optional link to `FlightBooking`.
    - `ferryBooking`: Optional link to `FerryBooking`.
    - `carRentalRequest`: Optional link to `CarRentalRequest`.

### 3. FlightBooking
Details for flight-specific transactions.
- `origin` / `destination`: Airport codes (e.g., CGK, SIN).
- `departureDate`: Travel date.
- `totalSales`: Final price including fees.
- `passengers`: Relation to multiple `Passenger` entries.

### 4. FerryBooking
Details for ferry-specific transactions.
- `originId` / `destinationId`: References to `Terminal`.
- `bookingNo`: Provider-side booking number.
- `passengers`: Relation to multiple `Passenger` entries.

### 5. Car & CarRentalRequest
Generic car rental system.
- `Car`: Stores car inventory, features, and pricing.
- `CarRentalRequest`: Handles the rental application (including KTP images for validation).

## 🛠️ CRUD via DAO

We use the DAO (Data Access Object) pattern to interact with these models. This keeps the database logic separated from the API routes.

**Example `UserDAO` Usage:**
```javascript
const UserDAO = require('../db/dao/UserDAO');

// Find a user by username
const user = await UserDAO.findByUsername('alvianzf');
```

## 📜 Migration & Seeding

- **Migrations**: New schema changes should be applied via `npx prisma migrate dev`.
- **Seeding**: Initial data (like the default admin) can be populated using the seed scripts in `db/seeds/`.

---

> [!IMPORTANT]
> Always ensure `DATABASE_URL` in `.env` is correctly configured before running migrations.
