# Full Architecture & Prisma Schema Map

This document describes the database architecture and data access patterns for `tiketq-bosbiller`. It contains the complete Prisma schema verbatim — every model, field, type, default value, relation, and table mapping — so that database queries can be written without guessing column names. It also documents the mandatory Data Access Object (DAO) pattern: all database interactions must be routed through DAO classes in `/db/dao/`, and route controllers must never import Prisma directly. Understanding this document is prerequisite to adding any new database model, relation, or query to the backend.

## The DAO Layer Rule
All database calls must be wrapped in Data Access Objects located in `/db/dao/`. Controllers (`routes/*.js`) must `require` the DAO class and call static methods. They must NEVER `require("../../db/index")` directly to execute raw queries.

> `routes/api/admin/index.js` predates this rule for several endpoints (e.g. `GET /admin/transactions` queries `prisma.transaction` directly) — not a pattern to copy. New admin code should go through `TransactionDAO` (`db/dao/TransactionDAO.js`), which has `findById` and `updateStatus`.

### Booking status vs. ticket issuance
`Transaction.status` is the canonical field the admin dashboard reads for the status badge (`PENDING` → `PAID` → `CANCELLED`/`REFUNDED`). It's kept in sync with each booking's `payment_status` inside the DAO methods that flip payment to true (`FlightBookingDAO.findBookingByCodeAndUpdatePaymentStatus`, `FerryBookingDAO.updatePaymentStatusByNo`) — do not update `payment_status` on a booking without also cascading to its linked `Transaction`.

`ticketIssued` (flight/ferry only) tracks whether the ticket has actually been issued, separately from payment — in this codebase they happen synchronously today, so `ticketIssued` flips `true` at the same moment as `payment_status`. It gates `PATCH /api/admin/transactions/:id/cancel` and `/refund`: once `true`, cancel/refund is blocked for that booking. Car rentals have no `ticketIssued` field and are always exempt from the block.

## Prisma Schema Exhaustive Map

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("users")
}

model Transaction {
  id                 Int               @id @default(autoincrement())
  serviceType        ServiceType       // Enum: FLIGHT, FERRY, CAR_RENTAL
  bookingCode        String?           @unique
  email              String?
  basePrice          Decimal?          @default(0)
  serviceFee         Decimal?          @default(0)
  totalSales         Decimal?          @default(0)
  payment_status     Boolean           @default(false)
  status             String?           @default("PENDING") // "PENDING" | "PAID" | "CANCELLED" | "REFUNDED"
  flightBookingId    Int?              @unique
  ferryBookingId     Int?              @unique
  carRentalRequestId Int?              @unique
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  carRentalRequest   CarRentalRequest? @relation(fields: [carRentalRequestId], references: [id], onDelete: Cascade)
  ferryBooking       FerryBooking?     @relation(fields: [ferryBookingId], references: [id], onDelete: Cascade)
  flightBooking      FlightBooking?    @relation(fields: [flightBookingId], references: [id], onDelete: Cascade)
  @@map("transactions")
}

model FlightBooking {
  id             Int          @id @default(autoincrement())
  bookingCode    String?      @unique
  nominal        String?
  departureDate  String?
  origin         String?
  destination    String?
  email          String?
  mobile_number  String?
  name           String?
  book_date      DateTime     @default(now())
  payment_status Boolean      @default(false)
  ticketIssued   Boolean      @default(false) // set true in the same DAO call that flips payment_status true
  passengers     Passenger[]
  transaction    Transaction?
  @@map("flight_bookings")
}

model FerryBooking {
  id             Int          @id @default(autoincrement())
  bookingNo      String?      @unique
  departureDate  DateTime?
  returnDate     DateTime?
  originId       Int?
  destinationId  Int?
  email          String?
  mobile_number  String?
  status         String?      @default("PENDING")
  payment_status Boolean      @default(false)
  ticketIssued   Boolean      @default(false) // set true in the same DAO call that flips payment_status true
  destination    Terminal?    @relation("DestinationTerminal", fields: [destinationId], references: [id])
  origin         Terminal?    @relation("OriginTerminal", fields: [originId], references: [id])
  passengers     Passenger[]
  transaction    Transaction?
  @@map("ferry_bookings")
}

model Passenger {
  id              Int            @id @default(autoincrement())
  title           String?
  firstName       String
  lastName        String
  passportNumber  String?
  nationality     String?
  dateOfBirth     DateTime?
  flightBookingId Int?
  ferryBookingId  Int?
  voucherCodeId   String?
  ferryBooking    FerryBooking?  @relation(fields: [ferryBookingId], references: [id], onDelete: Cascade)
  flightBooking   FlightBooking? @relation(fields: [flightBookingId], references: [id], onDelete: Cascade)
  @@map("passengers")
}

model Terminal {
  id                       Int            @id @default(autoincrement())
  code                     String         @unique
  name                     String
  city                     String?
  country                  String?
  destinationFerryBookings FerryBooking[] @relation("DestinationTerminal")
  originFerryBookings      FerryBooking[] @relation("OriginTerminal")
  @@map("terminals")
}

model Car {
  id              Int                @id @default(autoincrement())
  name            String
  type            String
  rows            Int
  pricePerDay     Decimal
  transmission    String?
  description     String?
  features        String[]
  available       Boolean            @default(true)
  pricingDuration String?            @default("hari")
  photos          CarPhoto[]
  rentals         CarRentalRequest[]
  @@map("cars")
}

model CarPhoto {
  id        Int      @id @default(autoincrement())
  filename  String
  url       String
  isPrimary Boolean  @default(false)
  carId     Int
  car       Car      @relation(fields: [carId], references: [id], onDelete: Cascade)
  @@map("car_photos")
}

model CarRentalRequest {
  id          Int          @id @default(autoincrement())
  carId       Int
  date        String
  fullName    String
  phone       String
  email       String
  ktpImage    String
  ktpSelfie   String
  status      String       @default("PENDING_REVIEW")
  rentalDays  Int?         @default(1)
  car         Car          @relation(fields: [carId], references: [id], onDelete: Cascade)
  transaction Transaction?
  @@map("car_rental_requests")
}
```
