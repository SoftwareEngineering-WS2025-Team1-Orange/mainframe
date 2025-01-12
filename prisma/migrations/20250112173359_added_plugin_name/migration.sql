/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `SupportedPowerSupply` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `imageUri` to the `SupportedPowerSupply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `SupportedPowerSupply` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PluginName" AS ENUM ('E3DC');

-- AlterTable
ALTER TABLE "SupportedPowerSupply" ADD COLUMN     "imageUri" TEXT NOT NULL,
ADD COLUMN     "name" "PluginName" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SupportedPowerSupply_name_key" ON "SupportedPowerSupply"("name");
