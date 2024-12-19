/*
  Warnings:

  - You are about to alter the column `progress` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "progress" SET DATA TYPE DOUBLE PRECISION;
