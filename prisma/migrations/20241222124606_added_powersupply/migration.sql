-- CreateTable
CREATE TABLE "PowerSupply" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "configSchemaId" INTEGER NOT NULL,

    CONSTRAINT "PowerSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportedPowerSupply" (
    "id" SERIAL NOT NULL,
    "configSchema" JSONB NOT NULL,

    CONSTRAINT "SupportedPowerSupply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PowerSupply" ADD CONSTRAINT "PowerSupply_configSchemaId_fkey" FOREIGN KEY ("configSchemaId") REFERENCES "SupportedPowerSupply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
