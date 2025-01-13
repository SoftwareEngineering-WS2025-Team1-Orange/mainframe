/*
  Warnings:

  - Made the column `ngoId` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_ngoId_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "ngoId" SET NOT NULL,
ALTER COLUMN "archived" SET DEFAULT false,
ALTER COLUMN "fundraising_closed" SET DEFAULT false,
ALTER COLUMN "fundraising_current" SET DEFAULT 0,
ALTER COLUMN "progress" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "NGO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
