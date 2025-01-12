/*
  Warnings:

  - You are about to drop the column `integratedPublicAddress` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `integratedPublicAddressId` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdateSuccessfull` on the `DonationBox` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[integratedPublicMoneroAddress]` on the table `DonationBox` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[integratedPublicMoneroAddressId]` on the table `DonationBox` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `integratedPublicMoneroAddress` to the `DonationBox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `integratedPublicMoneroAddressId` to the `DonationBox` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
-- DropIndex
DROP INDEX "DonationBox_integratedPublicAddressId_key";

-- DropIndex
DROP INDEX "DonationBox_integratedPublicAddress_key";

-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "integratedPublicAddress" TO "integratedPublicMoneroAddress";

-- AlterTable 
ALTER TABLE "DonationBox" RENAME COLUMN "integratedPublicAddressId" TO "integratedPublicMoneroAddressId";

-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "lastUpdateSuccessfull" TO "earningsLastUpdateSuccessfull";

-- CreateIndex
CREATE UNIQUE INDEX "DonationBox_integratedPublicMoneroAddress_key" ON "DonationBox"("integratedPublicMoneroAddress");

-- CreateIndex
CREATE UNIQUE INDEX "DonationBox_integratedPublicMoneroAddressId_key" ON "DonationBox"("integratedPublicMoneroAddressId");
