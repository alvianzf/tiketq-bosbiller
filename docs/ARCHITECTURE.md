# Full Architecture & Prisma Schema Map

**AI Context Note:** This document contains the exhaustive database schema to prevent Hallucination of column names. 

## The DAO Layer Rule
All database calls must be wrapped in Data Access Objects located in `/db/dao/`. Controllers (`routes/*.js`) must `require` the DAO class and call static methods. They must NEVER `require("../../db/index")` directly to execute raw queries.

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
  status             String?           @default("PENDING")
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
