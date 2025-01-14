/*
  Warnings:

  - You are about to drop the column `lastSolarStatus` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `solarStatusLastUpdateAt` on the `DonationBox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "lastSolarStatus" TO "lastSolarData";
ALTER TABLE "DonationBox" RENAME COLUMN "solarStatusLastUpdateAt" TO "solarDataLastUpdateAt";
