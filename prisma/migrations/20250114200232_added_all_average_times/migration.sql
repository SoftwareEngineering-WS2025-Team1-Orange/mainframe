/*
  Warnings:

  - You are about to drop the column `averageWorkingTimeLastSevenDays` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `averageWorkingTimeLastSevenDaysLastUpdateAt` on the `DonationBox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonationBox" 
RENAME COLUMN "averageWorkingTimeLastSevenDays" TO "averageWorkingTime";

ALTER TABLE "DonationBox"
RENAME COLUMN "averageWorkingTimeLastSevenDaysLastUpdateAt" TO "averageWorkingTimeLastUpdateAt";

ALTER TABLE "DonationBox" 
ADD COLUMN "averageIncomePerDayInCent" INTEGER,
ADD COLUMN "averageIncomePerDayInCentLastUpdateAt" TIMESTAMP(3);