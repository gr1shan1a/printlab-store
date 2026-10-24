ALTER TABLE "Product"
ADD COLUMN "plasticWeightGrams" INTEGER,
ADD COLUMN "plasticWastePercent" INTEGER NOT NULL DEFAULT 10;

CREATE TABLE "PlasticMaterial" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "brand" TEXT,
  "color" TEXT NOT NULL,
  "diameterMm" DOUBLE PRECISION NOT NULL DEFAULT 1.75,
  "spoolWeightGrams" INTEGER NOT NULL,
  "priceInKopecks" INTEGER NOT NULL,
  "remainingGrams" INTEGER NOT NULL,
  "supplier" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlasticMaterial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductPlasticUsage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "plasticMaterialId" TEXT NOT NULL,
  "grams" INTEGER NOT NULL,
  CONSTRAINT "ProductPlasticUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlasticMaterial_type_color_active_idx" ON "PlasticMaterial"("type", "color", "active");
CREATE UNIQUE INDEX "ProductPlasticUsage_productId_plasticMaterialId_key" ON "ProductPlasticUsage"("productId", "plasticMaterialId");
CREATE INDEX "ProductPlasticUsage_plasticMaterialId_idx" ON "ProductPlasticUsage"("plasticMaterialId");
ALTER TABLE "ProductPlasticUsage" ADD CONSTRAINT "ProductPlasticUsage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPlasticUsage" ADD CONSTRAINT "ProductPlasticUsage_plasticMaterialId_fkey" FOREIGN KEY ("plasticMaterialId") REFERENCES "PlasticMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
