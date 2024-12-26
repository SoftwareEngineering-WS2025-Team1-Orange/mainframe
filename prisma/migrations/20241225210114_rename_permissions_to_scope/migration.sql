/*
  Warnings:

  - You are about to drop the `DonatorPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NGOPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DonatorToDonatorPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_NGOToNGOPermissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DonatorScopeEnum" AS ENUM ('READ_ALL', 'READ_OWN', 'WRITE_ALL', 'WRITE_OWN');

-- CreateEnum
CREATE TYPE "NGOScopeEnum" AS ENUM ('READ_ALL', 'READ_OWN', 'WRITE_ALL', 'WRITE_OWN');

-- DropForeignKey
ALTER TABLE "_DonatorToDonatorPermissions" DROP CONSTRAINT "_DonatorToDonatorPermissions_A_fkey";

-- DropForeignKey
ALTER TABLE "_DonatorToDonatorPermissions" DROP CONSTRAINT "_DonatorToDonatorPermissions_B_fkey";

-- DropForeignKey
ALTER TABLE "_NGOToNGOPermissions" DROP CONSTRAINT "_NGOToNGOPermissions_A_fkey";

-- DropForeignKey
ALTER TABLE "_NGOToNGOPermissions" DROP CONSTRAINT "_NGOToNGOPermissions_B_fkey";

-- DropTable
DROP TABLE "DonatorPermissions";

-- DropTable
DROP TABLE "NGOPermissions";

-- DropTable
DROP TABLE "_DonatorToDonatorPermissions";

-- DropTable
DROP TABLE "_NGOToNGOPermissions";

-- DropEnum
DROP TYPE "DonatorPermissionsEnum";

-- DropEnum
DROP TYPE "NGOPermissionsEnum";

-- CreateTable
CREATE TABLE "DonatorScope" (
    "id" SERIAL NOT NULL,
    "name" "DonatorScopeEnum" NOT NULL,

    CONSTRAINT "DonatorScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NGOScope" (
    "id" SERIAL NOT NULL,
    "name" "NGOScopeEnum" NOT NULL,

    CONSTRAINT "NGOScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DonatorToDonatorScope" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonatorToDonatorScope_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_NGOToNGOScope" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NGOToNGOScope_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonatorScope_name_key" ON "DonatorScope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NGOScope_name_key" ON "NGOScope"("name");

-- CreateIndex
CREATE INDEX "_DonatorToDonatorScope_B_index" ON "_DonatorToDonatorScope"("B");

-- CreateIndex
CREATE INDEX "_NGOToNGOScope_B_index" ON "_NGOToNGOScope"("B");

-- AddForeignKey
ALTER TABLE "_DonatorToDonatorScope" ADD CONSTRAINT "_DonatorToDonatorScope_A_fkey" FOREIGN KEY ("A") REFERENCES "Donator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonatorToDonatorScope" ADD CONSTRAINT "_DonatorToDonatorScope_B_fkey" FOREIGN KEY ("B") REFERENCES "DonatorScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NGOToNGOScope" ADD CONSTRAINT "_NGOToNGOScope_A_fkey" FOREIGN KEY ("A") REFERENCES "NGO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NGOToNGOScope" ADD CONSTRAINT "_NGOToNGOScope_B_fkey" FOREIGN KEY ("B") REFERENCES "NGOScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
