/*
  Warnings:

  - You are about to drop the column `lastPowerSolarStatusUpdateAt` on the `DonationBox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "lastPowerSolarStatusUpdateAt" TO "solarStatusLastUpdateAt";
