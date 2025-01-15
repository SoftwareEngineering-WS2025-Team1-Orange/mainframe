/*
  Warnings:

  - You are about to drop the column `lastPayoutTimestamp` on the `MoneroMiningPayout` table. All the data in the column will be lost.
  - Added the required column `periodStart` to the `MoneroMiningPayout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MoneroMiningPayout" RENAME COLUMN "lastPayoutTimestamp" TO "periodStart";
