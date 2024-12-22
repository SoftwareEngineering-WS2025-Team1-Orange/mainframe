/*
  Warnings:

  - Added the required column `updatedAt` to the `PowerSupply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SupportedPowerSupply` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PowerSupply" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SupportedPowerSupply" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
