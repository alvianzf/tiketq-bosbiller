-- Catches up migration history with columns/indexes that were added
-- directly to the old production DB (schema.prisma already had them) but
-- never captured in a migration file. Discovered when the DB was rebuilt
-- from migration files alone on 2026-11-10 and every FlightBooking/
-- FerryBooking/CarRentalRequest/Passenger query started failing with
-- "column does not exist".

-- DropForeignKey
ALTER TABLE "car_rental_requests" DROP CONSTRAINT "car_rental_requests_carId_fkey";

-- DropForeignKey
ALTER TABLE "passengers" DROP CONSTRAINT "passengers_ferryBookingId_fkey";

-- DropForeignKey
ALTER TABLE "passengers" DROP CONSTRAINT "passengers_flightBookingId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_ferryBookingId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_flightBookingId_fkey";

-- AlterTable
ALTER TABLE "car_rental_requests" ADD COLUMN     "rentalDays" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "pricingDuration" TEXT DEFAULT 'hari';

-- AlterTable
ALTER TABLE "ferry_bookings" ADD COLUMN     "ticketIssued" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "flight_bookings" ADD COLUMN     "ticketIssued" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "passengers" ADD COLUMN     "cabinClass" TEXT DEFAULT 'economy',
ADD COLUMN     "isLapInfant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voucherCodeId" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "carRentalRequestId" INTEGER;

-- CreateIndex
CREATE INDEX "car_photos_carId_idx" ON "car_photos"("carId");

-- CreateIndex
CREATE INDEX "passengers_flightBookingId_idx" ON "passengers"("flightBookingId");

-- CreateIndex
CREATE INDEX "passengers_ferryBookingId_idx" ON "passengers"("ferryBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_carRentalRequestId_key" ON "transactions"("carRentalRequestId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_carRentalRequestId_fkey" FOREIGN KEY ("carRentalRequestId") REFERENCES "car_rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ferryBookingId_fkey" FOREIGN KEY ("ferryBookingId") REFERENCES "ferry_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "flight_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_ferryBookingId_fkey" FOREIGN KEY ("ferryBookingId") REFERENCES "ferry_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "flight_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_rental_requests" ADD CONSTRAINT "car_rental_requests_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
