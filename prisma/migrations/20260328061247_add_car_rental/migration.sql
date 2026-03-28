-- AlterEnum
ALTER TYPE "ServiceType" ADD VALUE 'CAR_RENTAL';

-- CreateTable
CREATE TABLE "cars" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "pricePerDay" DECIMAL(65,30) NOT NULL,
    "transmission" TEXT,
    "description" TEXT,
    "features" TEXT[],
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_photos" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "carId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_rental_requests" (
    "id" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ktpImage" TEXT NOT NULL,
    "ktpSelfie" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_rental_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "car_photos" ADD CONSTRAINT "car_photos_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_rental_requests" ADD CONSTRAINT "car_rental_requests_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
