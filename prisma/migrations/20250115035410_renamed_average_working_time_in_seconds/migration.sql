/*
  Warnings:

  - You are about to drop the column `averageWorkingTime` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `averageWorkingTimeLastUpdateAt` on the `DonationBox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "averageWorkingTime" TO "averageWorkingTimePerDayInSeconds";
ALTER TABLE "DonationBox" RENAME COLUMN "averageWorkingTimeLastUpdateAt" TO "averageWorkingTimePerDayInSecondsLastUpdateAt";
