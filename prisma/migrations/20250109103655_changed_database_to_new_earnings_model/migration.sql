/*
  Warnings:

  - You are about to drop the column `activeTimeInPeriod` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `payoutId` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the `Payout` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[integratedPublicAddress]` on the table `DonationBox` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[integratedPublicAddressId]` on the table `DonationBox` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `integratedPublicAddress` to the `DonationBox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `integratedPublicAddressId` to the `DonationBox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blockHeight` to the `Earning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastEarningTimeStamp` to the `Earning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Earning` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_payoutId_fkey";

-- AlterTable
ALTER TABLE "DonationBox" ADD COLUMN     "integratedPublicAddress" TEXT NOT NULL,
ADD COLUMN     "integratedPublicAddressId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Earning" DROP COLUMN "activeTimeInPeriod",
DROP COLUMN "payoutId",
ADD COLUMN     "blockHeight" INTEGER NOT NULL,
ADD COLUMN     "lastEarningTimeStamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Payout";

-- CreateIndex
CREATE UNIQUE INDEX "DonationBox_integratedPublicAddress_key" ON "DonationBox"("integratedPublicAddress");

-- CreateIndex
CREATE UNIQUE INDEX "DonationBox_integratedPublicAddressId_key" ON "DonationBox"("integratedPublicAddressId");
