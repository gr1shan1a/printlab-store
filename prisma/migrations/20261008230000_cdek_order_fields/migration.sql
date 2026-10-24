ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cdekOrderUuid" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cdekTrackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cdekStatus" TEXT;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'printlab_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "Order" TO printlab_app;
  END IF;
END $$;
