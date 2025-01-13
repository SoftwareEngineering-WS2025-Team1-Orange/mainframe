/*
  Warnings:

  - You are about to drop the column `powerSupplyId` on the `DonationBox` table. All the data in the column will be lost.
  - You are about to drop the `PowerSupply` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `donationBoxId` to the `Container` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Container` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DonationBox" DROP CONSTRAINT "DonationBox_powerSupplyId_fkey";

-- DropForeignKey
ALTER TABLE "PowerSupply" DROP CONSTRAINT "PowerSupply_configSchemaId_fkey";

-- DropForeignKey
ALTER TABLE "PowerSupply" DROP CONSTRAINT "PowerSupply_donatorId_fkey";

-- AlterTable
ALTER TABLE "Container" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "donationBoxId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "DonationBox" DROP COLUMN "powerSupplyId";

-- DropTable
DROP TABLE "PowerSupply";

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_donationBoxId_fkey" FOREIGN KEY ("donationBoxId") REFERENCES "DonationBox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
