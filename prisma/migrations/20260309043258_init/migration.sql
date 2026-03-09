-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('FLIGHT', 'FERRY');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "bookingCode" TEXT,
    "email" TEXT,
    "basePrice" DECIMAL(65,30) DEFAULT 0,
    "serviceFee" DECIMAL(65,30) DEFAULT 0,
    "totalSales" DECIMAL(65,30) DEFAULT 0,
    "payment_status" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT DEFAULT 'PENDING',
    "flightBookingId" INTEGER,
    "ferryBookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_bookings" (
    "id" SERIAL NOT NULL,
    "bookingCode" TEXT,
    "nominal" TEXT,
    "basePrice" DECIMAL(65,30) DEFAULT 0,
    "serviceFee" DECIMAL(65,30) DEFAULT 0,
    "totalSales" DECIMAL(65,30) DEFAULT 0,
    "departureDate" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "email" TEXT,
    "mobile_number" TEXT,
    "name" TEXT,
    "book_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_status" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ferry_bookings" (
    "id" SERIAL NOT NULL,
    "bookingNo" TEXT,
    "nominal" TEXT,
    "basePrice" DECIMAL(65,30) DEFAULT 0,
    "serviceFee" DECIMAL(65,30) DEFAULT 0,
    "totalSales" DECIMAL(65,30) DEFAULT 0,
    "departureDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "originId" INTEGER,
    "destinationId" INTEGER,
    "email" TEXT,
    "mobile_number" TEXT,
    "status" TEXT DEFAULT 'PENDING',
    "payment_status" BOOLEAN NOT NULL DEFAULT false,
    "book_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ferry_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passportNumber" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "flightBookingId" INTEGER,
    "ferryBookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminals" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bookingCode_key" ON "transactions"("bookingCode");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_flightBookingId_key" ON "transactions"("flightBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_ferryBookingId_key" ON "transactions"("ferryBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "flight_bookings_bookingCode_key" ON "flight_bookings"("bookingCode");

-- CreateIndex
CREATE UNIQUE INDEX "ferry_bookings_bookingNo_key" ON "ferry_bookings"("bookingNo");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_code_key" ON "terminals"("code");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "flight_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ferryBookingId_fkey" FOREIGN KEY ("ferryBookingId") REFERENCES "ferry_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferry_bookings" ADD CONSTRAINT "ferry_bookings_originId_fkey" FOREIGN KEY ("originId") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferry_bookings" ADD CONSTRAINT "ferry_bookings_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "flight_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_ferryBookingId_fkey" FOREIGN KEY ("ferryBookingId") REFERENCES "ferry_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
