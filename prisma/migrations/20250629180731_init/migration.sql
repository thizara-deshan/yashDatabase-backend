/*
  Warnings:

  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `numPeople` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `packageId` on the `Booking` table. All the data in the column will be lost.
  - The `status` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DestinationToPackage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `numberOfPeople` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tourPackageId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `travelDate` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tourPackageId` to the `Destination` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ASSIGNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_packageId_fkey";

-- DropForeignKey
ALTER TABLE "_DestinationToPackage" DROP CONSTRAINT "_DestinationToPackage_A_fkey";

-- DropForeignKey
ALTER TABLE "_DestinationToPackage" DROP CONSTRAINT "_DestinationToPackage_B_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "date",
DROP COLUMN "numPeople",
DROP COLUMN "packageId",
ADD COLUMN     "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numberOfPeople" INTEGER NOT NULL,
ADD COLUMN     "specialRequests" TEXT,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tourPackageId" INTEGER NOT NULL,
ADD COLUMN     "travelDate" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "tourPackageId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Package";

-- DropTable
DROP TABLE "_DestinationToPackage";

-- CreateTable
CREATE TABLE "assigned_bookings" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,

    CONSTRAINT "assigned_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPackage" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "prices" DOUBLE PRECISION NOT NULL,
    "image" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPlanDay" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "endOfTheDay" TEXT NOT NULL,
    "tourPackageId" INTEGER NOT NULL,

    CONSTRAINT "TourPlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assigned_bookings_bookingId_key" ON "assigned_bookings"("bookingId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assigned_bookings" ADD CONSTRAINT "assigned_bookings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assigned_bookings" ADD CONSTRAINT "assigned_bookings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPlanDay" ADD CONSTRAINT "TourPlanDay_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
