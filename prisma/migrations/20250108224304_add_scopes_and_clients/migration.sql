/*
  Warnings:

  - The values [NOT_IMPLEMENTED] on the enum `DonatorScopeEnum` will be removed. If these variants are still used in the database, this will fail.
  - The values [NOT_IMPLEMENTED] on the enum `NGOScopeEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DonatorScopeEnum_new" AS ENUM ('read:donation', 'write:donation', 'read:donationbox', 'write:donationbox', 'read:donator', 'write:donator', 'read:ngo', 'read:project', 'read:transaction');
ALTER TABLE "DonatorScope" ALTER COLUMN "name" TYPE "DonatorScopeEnum_new" USING ("name"::text::"DonatorScopeEnum_new");
ALTER TYPE "DonatorScopeEnum" RENAME TO "DonatorScopeEnum_old";
ALTER TYPE "DonatorScopeEnum_new" RENAME TO "DonatorScopeEnum";
DROP TYPE "DonatorScopeEnum_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NGOScopeEnum_new" AS ENUM ('read:ngo', 'write:ngo', 'read:project', 'write:project');
ALTER TABLE "NGOScope" ALTER COLUMN "name" TYPE "NGOScopeEnum_new" USING ("name"::text::"NGOScopeEnum_new");
ALTER TYPE "NGOScopeEnum" RENAME TO "NGOScopeEnum_old";
ALTER TYPE "NGOScopeEnum_new" RENAME TO "NGOScopeEnum";
DROP TYPE "NGOScopeEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "NGOScope" ADD COLUMN     "nGOClientId" TEXT;

-- CreateTable
CREATE TABLE "NGOClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientSecretExpires" INTEGER NOT NULL,
    "clientSecretLifetime" INTEGER NOT NULL,
    "accessTokenLifetime" INTEGER NOT NULL,
    "refreshTokenLifetime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NGOClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonatorClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientSecretExpires" BIGINT NOT NULL,
    "clientSecretLifetime" BIGINT NOT NULL,
    "accessTokenLifetime" BIGINT NOT NULL,
    "refreshTokenLifetime" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonatorClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NGOClientToNGOScope" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NGOClientToNGOScope_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DonatorClientToDonatorScope" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonatorClientToDonatorScope_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "NGOClient_clientId_key" ON "NGOClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "DonatorClient_clientId_key" ON "DonatorClient"("clientId");

-- CreateIndex
CREATE INDEX "_NGOClientToNGOScope_B_index" ON "_NGOClientToNGOScope"("B");

-- CreateIndex
CREATE INDEX "_DonatorClientToDonatorScope_B_index" ON "_DonatorClientToDonatorScope"("B");

-- AddForeignKey
ALTER TABLE "_NGOClientToNGOScope" ADD CONSTRAINT "_NGOClientToNGOScope_A_fkey" FOREIGN KEY ("A") REFERENCES "NGOClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NGOClientToNGOScope" ADD CONSTRAINT "_NGOClientToNGOScope_B_fkey" FOREIGN KEY ("B") REFERENCES "NGOScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonatorClientToDonatorScope" ADD CONSTRAINT "_DonatorClientToDonatorScope_A_fkey" FOREIGN KEY ("A") REFERENCES "DonatorClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonatorClientToDonatorScope" ADD CONSTRAINT "_DonatorClientToDonatorScope_B_fkey" FOREIGN KEY ("B") REFERENCES "DonatorScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
