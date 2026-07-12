/*
  Warnings:

  - You are about to drop the column `cost` on the `FuelLog` table. All the data in the column will be lost.
  - You are about to drop the column `odometer` on the `FuelLog` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "TripStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "FuelLog" DROP COLUMN "cost",
DROP COLUMN "odometer",
ADD COLUMN     "costPerLiter" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "odometerReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stationName" TEXT,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "isDelayed" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
