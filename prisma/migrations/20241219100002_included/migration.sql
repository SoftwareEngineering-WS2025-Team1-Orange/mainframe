-- CreateTable
CREATE TABLE "FavouriteProject" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "donatorId" INTEGER NOT NULL,

    CONSTRAINT "FavouriteProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavouriteNgo" (
    "id" SERIAL NOT NULL,
    "ngoId" INTEGER NOT NULL,
    "donatorId" INTEGER NOT NULL,

    CONSTRAINT "FavouriteNgo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FavouriteProject" ADD CONSTRAINT "FavouriteProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteProject" ADD CONSTRAINT "FavouriteProject_donatorId_fkey" FOREIGN KEY ("donatorId") REFERENCES "Donator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteNgo" ADD CONSTRAINT "FavouriteNgo_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "NGO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteNgo" ADD CONSTRAINT "FavouriteNgo_donatorId_fkey" FOREIGN KEY ("donatorId") REFERENCES "Donator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
