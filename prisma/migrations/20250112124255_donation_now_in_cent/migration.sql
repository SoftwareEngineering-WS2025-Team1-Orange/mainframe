/*
  Warnings:

  - You are about to drop the column `amount` on the `Donation` table. All the data in the column will be lost.
  - Added the required column `amountInCent` to the `Donation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Donation" 
ADD COLUMN     "amountInCent" INTEGER;

UPDATE "Donation"
SET "amountInCent" = CAST("amount" AS INTEGER);

ALTER TABLE "Donation" 
ALTER COLUMN "amountInCent" SET NOT NULL;

ALTER TABLE "Donation" 
DROP COLUMN "amount";
