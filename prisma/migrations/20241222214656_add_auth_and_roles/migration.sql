-- CreateEnum
CREATE TYPE "DonatorPermissionsEnum" AS ENUM ('READ_ALL', 'READ_OWN', 'WRITE_ALL', 'WRITE_OWN');

-- CreateEnum
CREATE TYPE "NGOPermissionsEnum" AS ENUM ('READ_ALL', 'READ_OWN', 'WRITE_ALL', 'WRITE_OWN');

-- AlterTable
ALTER TABLE "Donator" ADD COLUMN     "refreshToken" TEXT;

-- AlterTable
ALTER TABLE "NGO" ADD COLUMN     "refreshToken" TEXT;

-- CreateTable
CREATE TABLE "DonatorPermissions" (
    "id" SERIAL NOT NULL,
    "name" "DonatorPermissionsEnum" NOT NULL,

    CONSTRAINT "DonatorPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NGOPermissions" (
    "id" SERIAL NOT NULL,
    "name" "NGOPermissionsEnum" NOT NULL,

    CONSTRAINT "NGOPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DonatorToDonatorPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonatorToDonatorPermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_NGOToNGOPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NGOToNGOPermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonatorPermissions_name_key" ON "DonatorPermissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NGOPermissions_name_key" ON "NGOPermissions"("name");

-- CreateIndex
CREATE INDEX "_DonatorToDonatorPermissions_B_index" ON "_DonatorToDonatorPermissions"("B");

-- CreateIndex
CREATE INDEX "_NGOToNGOPermissions_B_index" ON "_NGOToNGOPermissions"("B");

-- AddForeignKey
ALTER TABLE "_DonatorToDonatorPermissions" ADD CONSTRAINT "_DonatorToDonatorPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Donator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonatorToDonatorPermissions" ADD CONSTRAINT "_DonatorToDonatorPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "DonatorPermissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NGOToNGOPermissions" ADD CONSTRAINT "_NGOToNGOPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "NGO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NGOToNGOPermissions" ADD CONSTRAINT "_NGOToNGOPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "NGOPermissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
