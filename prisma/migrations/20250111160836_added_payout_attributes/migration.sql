/*
  Warnings:

  - Added the required column `txnHash` to the `Earning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `txnKey` to the `Earning` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Earning" ADD COLUMN     "txnHash" TEXT NOT NULL,
ADD COLUMN     "txnKey" TEXT NOT NULL;
