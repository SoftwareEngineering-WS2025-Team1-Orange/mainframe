/*
  Warnings:

  - Added the required column `workingTime` to the `Earning` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Earning" ADD COLUMN     "workingTime" INTEGER NOT NULL;
