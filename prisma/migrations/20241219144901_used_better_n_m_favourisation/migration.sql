/*
  Warnings:

  - You are about to drop the `FavouriteNgo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FavouriteProject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FavouriteNgo" DROP CONSTRAINT "FavouriteNgo_donatorId_fkey";

-- DropForeignKey
ALTER TABLE "FavouriteNgo" DROP CONSTRAINT "FavouriteNgo_ngoId_fkey";

-- DropForeignKey
ALTER TABLE "FavouriteProject" DROP CONSTRAINT "FavouriteProject_donatorId_fkey";

-- DropForeignKey
ALTER TABLE "FavouriteProject" DROP CONSTRAINT "FavouriteProject_projectId_fkey";

-- DropTable
DROP TABLE "FavouriteNgo";

-- DropTable
DROP TABLE "FavouriteProject";

-- CreateTable
CREATE TABLE "_DonatorToNGO" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonatorToNGO_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DonatorToProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonatorToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DonatorToNGO_B_index" ON "_DonatorToNGO"("B");

-- CreateIndex
CREATE INDEX "_DonatorToProject_B_index" ON "_DonatorToProject"("B");

-- AddForeignKey
ALTER TABLE "_DonatorToNGO" ADD CONSTRAINT "_DonatorToNGO_A_fkey" FOREIGN KEY ("A") REFERENCES "Donator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonatorToNGO" ADD CONSTRAINT "_DonatorToNGO_B_fkey" FOREIGN KEY ("B") REFERENCES "NGO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonatorToProject" ADD CONSTRAINT "_DonatorToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Donator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonatorToProject" ADD CONSTRAINT "_DonatorToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
