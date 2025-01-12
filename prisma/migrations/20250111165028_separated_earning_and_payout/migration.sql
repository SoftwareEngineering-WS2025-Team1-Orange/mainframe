/*
  Warnings:

  - You are about to drop the column `amount` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `lastEarningTimeStamp` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `txnHash` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `txnKey` on the `Earning` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Earning" DROP COLUMN "amount",
DROP COLUMN "lastEarningTimeStamp",
DROP COLUMN "timestamp",
DROP COLUMN "txnHash",
DROP COLUMN "txnKey",
ADD COLUMN     "amountInCent" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "moneroMiningPayout" (
    "id" SERIAL NOT NULL,
    "amountInPiconero" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lastPayoutTimestamp" TIMESTAMP(3) NOT NULL,
    "txnHash" TEXT NOT NULL,
    "txnKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "earningId" INTEGER NOT NULL,

    CONSTRAINT "moneroMiningPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moneroMiningPayout_earningId_key" ON "moneroMiningPayout"("earningId");

-- AddForeignKey
ALTER TABLE "moneroMiningPayout" ADD CONSTRAINT "moneroMiningPayout_earningId_fkey" FOREIGN KEY ("earningId") REFERENCES "Earning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Earning" ALTER COLUMN "amountInCent" DROP DEFAULT;
