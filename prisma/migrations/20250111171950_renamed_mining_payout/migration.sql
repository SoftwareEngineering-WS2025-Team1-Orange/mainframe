/*
  Warnings:

  - You are about to drop the `moneroMiningPayout` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "moneroMiningPayout" RENAME TO "MoneroMiningPayout";
-- AlterTable
ALTER TABLE "MoneroMiningPayout" RENAME CONSTRAINT "moneroMiningPayout_pkey" TO "MoneroMiningPayout_pkey";

-- RenameForeignKey
ALTER TABLE "MoneroMiningPayout" RENAME CONSTRAINT "moneroMiningPayout_earningId_fkey" TO "MoneroMiningPayout_earningId_fkey";

-- RenameIndex
ALTER INDEX "moneroMiningPayout_earningId_key" RENAME TO "MoneroMiningPayout_earningId_key";
