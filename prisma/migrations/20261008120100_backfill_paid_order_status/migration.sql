UPDATE "Order"
SET "status" = 'PAID'
WHERE "paymentStatus" = 'PAID' AND "status" = 'NEW';

INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "createdAt")
SELECT 'paid-backfill-' || "id", "id", 'PAID', NOW()
FROM "Order"
WHERE "paymentStatus" = 'PAID' AND "status" = 'PAID'
  AND NOT EXISTS (
    SELECT 1 FROM "OrderStatusHistory" h WHERE h."orderId" = "Order"."id" AND h."status" = 'PAID'
  );
