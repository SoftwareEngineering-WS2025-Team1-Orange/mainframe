-- AlterTable
ALTER TABLE "DonationBox" ADD COLUMN     "earningsLastSuccessfullUpdateAt" TIMESTAMP(3),
ADD COLUMN     "lastUpdateSuccessfull" BOOLEAN NOT NULL DEFAULT false;
