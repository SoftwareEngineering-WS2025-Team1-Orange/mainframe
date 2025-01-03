/*
  Warnings:

  - You are about to drop the column `CUID` on the `DonationBox` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cuid]` on the table `DonationBox` will be added. If there are existing duplicate values, this will fail.
  - The required column `cuid` was added to the `DonationBox` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "DonationBox_CUID_key";

-- AlterTable
ALTER TABLE "DonationBox" RENAME COLUMN "CUID" TO "cuid"; --altered this manually as prisma wanted to drop and add the column

-- CreateIndex
CREATE UNIQUE INDEX "DonationBox_cuid_key" ON "DonationBox"("cuid");
