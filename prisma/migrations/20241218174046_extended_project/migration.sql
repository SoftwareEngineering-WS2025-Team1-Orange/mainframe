/*
  Warnings:

  - You are about to drop the column `deadline` on the `Project` table. All the data in the column will be lost.
  - Added the required column `archived` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fundraising_closed` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fundraising_current` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `progress` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_date` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Education', 'Health', 'Environment', 'Human_Rights', 'Animal_Rights', 'Social', 'OTHER');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "deadline",
ADD COLUMN     "archived" BOOLEAN NOT NULL,
ADD COLUMN     "category" "Category" NOT NULL,
ADD COLUMN     "fundraising_closed" BOOLEAN NOT NULL,
ADD COLUMN     "fundraising_current" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "progress" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "target_date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "fundraising_goal" SET DATA TYPE DOUBLE PRECISION;
