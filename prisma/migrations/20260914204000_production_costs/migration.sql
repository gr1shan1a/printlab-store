ALTER TABLE "Product"
ADD COLUMN "printMinutes100" INTEGER,
ADD COLUMN "printMinutes166" INTEGER;

CREATE TABLE "ProductionCostSettings" (
  "id" TEXT NOT NULL DEFAULT 'main',
  "printerName" TEXT NOT NULL DEFAULT 'Bambu Lab A1',
  "purchasePriceKopecks" INTEGER NOT NULL DEFAULT 4600000,
  "maintenanceKopecks" INTEGER NOT NULL DEFAULT 400000,
  "resourceHours" INTEGER NOT NULL DEFAULT 3000,
  "powerWatts" INTEGER NOT NULL DEFAULT 1300,
  "electricityKopecksKwh" INTEGER NOT NULL DEFAULT 700,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionCostSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProductionCostSettings" ("id","printerName","purchasePriceKopecks","maintenanceKopecks","resourceHours","powerWatts","electricityKopecksKwh","updatedAt")
VALUES ('main','Bambu Lab A1',4600000,400000,3000,1300,700,CURRENT_TIMESTAMP);
