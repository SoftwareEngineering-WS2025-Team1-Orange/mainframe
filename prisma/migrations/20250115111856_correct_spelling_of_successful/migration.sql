/*
  Warnings:

  - You are about to drop the column `earningsLastSuccessfullUpdateAt` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `earningsLastUpdateSuccessfull` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `solarDataLastSuccessfullUpdateAt` on the `DonationBox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "earningsLastSuccessfullUpdateAt" TO "earningsLastSuccessfulUpdateAt";
ALTER TABLE "DonationBox" RENAME COLUMN "earningsLastUpdateSuccessfull" TO "earningsLastUpdateSuccessful";
ALTER TABLE "DonationBox" RENAME COLUMN "solarDataLastSuccessfullUpdateAt" TO "solarDataLastSuccessfulUpdateAt";
