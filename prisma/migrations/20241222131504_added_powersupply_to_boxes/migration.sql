-- AlterTable
ALTER TABLE "DonationBox" ADD COLUMN     "powerSupplyId" INTEGER;

-- AddForeignKey
ALTER TABLE "DonationBox" ADD CONSTRAINT "DonationBox_powerSupplyId_fkey" FOREIGN KEY ("powerSupplyId") REFERENCES "PowerSupply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
