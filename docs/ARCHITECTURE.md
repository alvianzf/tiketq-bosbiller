# Full Architecture & Prisma Schema Map

This document describes the database architecture and data access patterns for `tiketq-bosbiller`. It contains the complete Prisma schema verbatim — every model, field, type, default value, relation, and table mapping — so that database queries can be written without guessing column names. It also documents the mandatory Data Access Object (DAO) pattern: all database interactions must be routed through DAO classes in `/db/dao/`, and route controllers must never import Prisma directly. Understanding this document is prerequisite to adding any new database model, relation, or query to the backend.

## The DAO Layer Rule
All database calls must be wrapped in Data Access Objects located in `/db/dao/`. Controllers (`routes/*.js`) must `require` the DAO class and call static methods. They must NEVER `require("../../db/index")` directly to execute raw queries.

> `routes/api/admin/index.js` predates this rule for several endpoints (e.g. `GET /admin/transactions` queries `prisma.transaction` directly) — not a pattern to copy. New admin code should go through `TransactionDAO` (`db/dao/TransactionDAO.js`), which has `findById` and `updateStatus`.

### Booking status vs. ticket issuance
`Transaction.status` is the canonical field the admin dashboard reads for the status badge (`PENDING` → `PAID` → `CANCELLED`/`REFUNDED`). It's kept in sync with each booking's `payment_status` inside the DAO methods that flip payment to true (`FlightBookingDAO.findBookingByCodeAndUpdatePaymentStatus`, `FerryBookingDAO.updatePaymentStatusByNo`) — do not update `payment_status` on a booking without also cascading to its linked `Transaction`.

`ticketIssued` (flight/ferry only) tracks whether the ticket has actually been issued, separately from payment — in this codebase they happen synchronously today, so `ticketIssued` flips `true` at the same moment as `payment_status`. It gates `PATCH /api/admin/transactions/:id/cancel` and `/refund`: once `true`, cancel/refund is blocked for that booking. Car rentals have no `ticketIssued` field and are always exempt from the block.

### Concierge pivot: Hotel, Activity, Destination, Itinerary
Added for the Batam ⇄ Malaysia ⇄ Singapore concierge pivot (see repo-root `CLAUDE.md` and `tiket-FE/specs/00-OVERVIEW.md`). `Hotel`/`HotelBooking` and `Activity`/`ActivityBooking` follow the exact `Car`/`CarRentalRequest` lead-request pattern (`HotelDAO.js`, `ActivityDAO.js`) — `status: "PENDING_REVIEW"` default, a `Transaction` created alongside with the computed total, no DANA step at submit time. `Destination` is the **ItinerQ** trip-builder catalog (admin-managed via `DestinationDAO.js`); `Itinerary`/`ItineraryItem` hold a traveler's drag-and-drop trip — each `ItineraryItem` snapshots `label`/`price`/`durationMinutes`/`travelGapMinutes` from the `Destination` at build time (via `ItineraryDAO.createItinerary`), so a later catalog edit doesn't retroactively change a saved plan. `ItineraryItem.serviceType` is a free string (not the `ServiceType` enum) so a stop can be a `Destination` (`"DESTINATION"`) or a generic line item.

The migration for these models (`prisma/migrations/20261109000000_add_concierge_pivot/`) is applied by the backend deploy pipeline's `prisma migrate deploy` step (`.github/workflows/deploy.yml`) — non-fatal if the DB host is unreachable, retried on the next deploy.

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
  serviceType        ServiceType       // Enum: FLIGHT, FERRY, CAR_RENTAL, HOTEL, ACTIVITY, ITINERARY
  bookingCode        String?           @unique
  email              String?
  basePrice          Decimal?          @default(0)
  serviceFee         Decimal?          @default(0)
  totalSales         Decimal?          @default(0)
  payment_status     Boolean           @default(false)
  status             String?           @default("PENDING") // "PENDING" | "PAID" | "CANCELLED" | "REFUNDED"
  flightBookingId    Int?              @unique
  ferryBookingId     Int?              @unique
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  carRentalRequestId Int?              @unique
  hotelBookingId     Int?              @unique
  activityBookingId  Int?              @unique
  itineraryId        Int?              @unique
  carRentalRequest   CarRentalRequest? @relation(fields: [carRentalRequestId], references: [id], onDelete: Cascade)
  ferryBooking       FerryBooking?     @relation(fields: [ferryBookingId], references: [id], onDelete: Cascade)
  flightBooking      FlightBooking?    @relation(fields: [flightBookingId], references: [id], onDelete: Cascade)
  hotelBooking       HotelBooking?     @relation(fields: [hotelBookingId], references: [id], onDelete: Cascade)
  activityBooking    ActivityBooking?  @relation(fields: [activityBookingId], references: [id], onDelete: Cascade)
  itinerary          Itinerary?        @relation(fields: [itineraryId], references: [id], onDelete: Cascade)

  @@map("transactions")
}

model FlightBooking {
  id             Int          @id @default(autoincrement())
  bookingCode    String?      @unique
  nominal        String?
  basePrice      Decimal?     @default(0)
  serviceFee     Decimal?     @default(0)
  totalSales     Decimal?     @default(0)
  departureDate  String?
  origin         String?
  destination    String?
  email          String?
  mobile_number  String?
  name           String?
  book_date      DateTime     @default(now())
  payment_status Boolean      @default(false)
  ticketIssued   Boolean      @default(false) // set true in the same DAO call that flips payment_status true
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  passengers     Passenger[]
  transaction    Transaction?

  @@map("flight_bookings")
}

model FerryBooking {
  id             Int          @id @default(autoincrement())
  bookingNo      String?      @unique
  nominal        String?
  basePrice      Decimal?     @default(0)
  serviceFee     Decimal?     @default(0)
  totalSales     Decimal?     @default(0)
  departureDate  DateTime?
  returnDate     DateTime?
  originId       Int?
  destinationId  Int?
  email          String?
  mobile_number  String?
  status         String?      @default("PENDING")
  payment_status Boolean      @default(false)
  ticketIssued   Boolean      @default(false) // set true in the same DAO call that flips payment_status true
  book_date      DateTime     @default(now())
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
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
  cabinClass      String?        @default("economy")
  isLapInfant     Boolean        @default(false)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  ferryBooking    FerryBooking?  @relation(fields: [ferryBookingId], references: [id], onDelete: Cascade)
  flightBooking   FlightBooking? @relation(fields: [flightBookingId], references: [id], onDelete: Cascade)

  @@index([flightBookingId])
  @@index([ferryBookingId])
  @@map("passengers")
}

model Terminal {
  id                       Int            @id @default(autoincrement())
  code                     String         @unique
  name                     String
  city                     String?
  country                  String?
  createdAt                DateTime       @default(now())
  updatedAt                DateTime       @updatedAt
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
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
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
  createdAt DateTime @default(now())
  car       Car      @relation(fields: [carId], references: [id], onDelete: Cascade)

  @@index([carId])
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
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  rentalDays  Int?         @default(1)
  car         Car          @relation(fields: [carId], references: [id], onDelete: Cascade)
  transaction Transaction?

  @@map("car_rental_requests")
}

model Hotel {
  id          Int           @id @default(autoincrement())
  name        String
  location    String
  description String?
  pricePerNight Decimal
  amenities   String[]
  photos      String[]
  available   Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  bookings    HotelBooking[]

  @@map("hotels")
}

model HotelBooking {
  id          Int          @id @default(autoincrement())
  hotelId     Int
  checkIn     String
  checkOut    String
  guests      Int          @default(1)
  fullName    String
  phone       String
  email       String
  status      String       @default("PENDING_REVIEW")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  hotel       Hotel        @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  transaction Transaction?

  @@map("hotel_bookings")
}

model Activity {
  id          Int               @id @default(autoincrement())
  name        String
  category    String
  location    String?
  description String?
  price       Decimal
  duration    String?
  photos      String[]
  available   Boolean           @default(true)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  bookings    ActivityBooking[]

  @@map("activities")
}

model ActivityBooking {
  id           Int          @id @default(autoincrement())
  activityId   Int
  date         String
  participants Int          @default(1)
  fullName     String
  phone        String
  email        String
  status       String       @default("PENDING_REVIEW")
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  activity     Activity     @relation(fields: [activityId], references: [id], onDelete: Cascade)
  transaction  Transaction?

  @@map("activity_bookings")
}

// A traveler-built bundle referencing any mix of the other services (ferry,
// flight, car rental, hotel, activity) by loose label/price — not an FK into
// each booking table, since a bundle is assembled before those bookings exist.
model Itinerary {
  id           Int             @id @default(autoincrement())
  fullName     String
  phone        String
  email        String
  startDate    String
  endDate      String?
  durationLabel String?        // client-chosen trip length, e.g. "1 Day", "6 Hours", "2 Days"
  interests    String[]        // optional tags used when the AI assisted this build
  notes        String?
  status       String          @default("PENDING_REVIEW")
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  items        ItineraryItem[]
  transaction  Transaction?

  @@map("itineraries")
}

// One stop in a drag-and-drop built trip. destinationId is set when the stop
// is a catalog Destination (the common case); serviceType/label/price stay
// generic so a stop can also be a ferry/flight/car-rental/hotel/activity line
// item. duration/travelGap are snapshotted from the Destination at build time
// so a later catalog price/time edit doesn't retroactively change a saved plan.
model ItineraryItem {
  id               Int          @id @default(autoincrement())
  itineraryId      Int
  destinationId    Int?
  serviceType      String
  label            String
  price            Decimal      @default(0)
  order            Int          @default(0)
  durationMinutes  Int?
  travelGapMinutes Int?
  createdAt        DateTime     @default(now())
  itinerary        Itinerary    @relation(fields: [itineraryId], references: [id], onDelete: Cascade)
  destination      Destination? @relation(fields: [destinationId], references: [id])

  @@index([itineraryId])
  @@map("itinerary_items")
}

// Admin-managed catalog of Batam places the client drags into their trip.
model Destination {
  id               Int             @id @default(autoincrement())
  name             String
  area             String          // e.g. Nagoya, Nongsa, Barelang
  category         String?         // Beach, Nature, Shopping, Culture, Golf, ...
  description      String?
  tags             String[]        // interest keywords for the AI recommender
  minStayMinutes   Int             @default(30)
  travelGapMinutes Int             @default(15) // default buffer to travel/arrive here
  price            Decimal         @default(0)  // entry fee / cost per visit
  photos           String[]
  available        Boolean         @default(true)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  itineraryItems   ItineraryItem[]

  @@map("destinations")
}

enum ServiceType {
  FLIGHT
  FERRY
  CAR_RENTAL
  HOTEL
  ACTIVITY
  ITINERARY
}
```
