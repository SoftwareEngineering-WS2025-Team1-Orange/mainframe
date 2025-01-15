/*
  Warnings:

  - You are about to drop the column `solarDataLastUpdateAt` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `workingTime` on the `Earning` table. All the data in the column will be lost.
  - Added the required column `workingTimeInSeconds` to the `Earning` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "solarDataLastUpdateAt" TO "solarDataLastSuccessfullUpdateAt";

-- AlterTable
ALTER TABLE "Earning" RENAME COLUMN "workingTime" TO "workingTimeInSeconds";
