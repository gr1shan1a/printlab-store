ALTER TABLE "Product"
ADD COLUMN "colorSelectable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fixedColors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "ProductVariant"
ADD COLUMN "configuration" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "ProductVariant"
SET "configuration" = COALESCE("size", 'Стандартная');

UPDATE "Product"
SET "fixedColors" = CASE
  WHEN "color" = 'Чёрный / оранжевый' THEN ARRAY['Чёрный', 'Оранжевый']
  WHEN "color" = 'Графит / оранжевый / песочный' THEN ARRAY['Графит', 'Оранжевый', 'Песочный']
  WHEN "color" = 'Чёрный, белый, красный' THEN ARRAY['Чёрный', 'Белый', 'Красный']
  WHEN "color" = 'Чёрный, красный, белый' THEN ARRAY['Чёрный', 'Красный', 'Белый']
  ELSE ARRAY["color"]
END;

UPDATE "Product"
SET "colorSelectable" = true
WHERE "slug" = 'raspberry-pi-case';
