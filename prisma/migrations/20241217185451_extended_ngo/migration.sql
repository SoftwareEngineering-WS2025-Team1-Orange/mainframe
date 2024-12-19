/*
  Warnings:

  - Added the required column `address` to the `NGO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact` to the `NGO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `NGO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `website_url` to the `NGO` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NGO" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "contact" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "website_url" TEXT NOT NULL;
