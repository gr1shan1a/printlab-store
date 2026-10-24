ALTER TABLE "PlasticMaterial"
ADD COLUMN "unopenedSpools" INTEGER NOT NULL DEFAULT 0;

-- Преобразуем прежний общий остаток в количество полных катушек
-- и остаток текущей открытой катушки без потери общего количества пластика.
UPDATE "PlasticMaterial"
SET
  "unopenedSpools" = FLOOR("remainingGrams"::numeric / "spoolWeightGrams")::integer,
  "remainingGrams" = MOD("remainingGrams", "spoolWeightGrams")
WHERE "spoolWeightGrams" > 0;
