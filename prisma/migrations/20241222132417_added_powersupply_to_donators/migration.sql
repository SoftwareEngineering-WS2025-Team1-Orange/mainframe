-- AlterTable
ALTER TABLE "PowerSupply" ADD COLUMN     "donatorId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "PowerSupply" ADD CONSTRAINT "PowerSupply_donatorId_fkey" FOREIGN KEY ("donatorId") REFERENCES "Donator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
