/*
  Warnings:

  - You are about to drop the column `last_status` on the `DonationBox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonationBox" DROP COLUMN "last_status",
ADD COLUMN     "lastSolarStatus" JSONB;

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "Container" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerStatus" (
    "id" SERIAL NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "statusMsg" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "containerId" INTEGER NOT NULL,

    CONSTRAINT "ContainerStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Container_name_key" ON "Container"("name");

-- AddForeignKey
ALTER TABLE "ContainerStatus" ADD CONSTRAINT "ContainerStatus_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
