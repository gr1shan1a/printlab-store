ALTER TABLE "ProductionTask" ALTER COLUMN "orderItemId" DROP NOT NULL;
ALTER TABLE "ProductionTask" ADD COLUMN "customRequestId" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN "reference" TEXT;

CREATE UNIQUE INDEX "ProductionTask_customRequestId_key" ON "ProductionTask"("customRequestId");

ALTER TABLE "ProductionTask"
ADD CONSTRAINT "ProductionTask_customRequestId_fkey"
FOREIGN KEY ("customRequestId") REFERENCES "ContactMessage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Уже подтверждённые заявки не должны потеряться при включении новой очереди.
INSERT INTO "ProductionTask" (
  "id", "customRequestId", "quantity", "status", "notes"
)
SELECT
  'request_' || md5(request."id"),
  request."id",
  COALESCE(request."quantity", 1),
  CASE
    WHEN request."workflowStatus" = 'IN_PRODUCTION' THEN 'PRINTING'::"ProductionStatus"
    WHEN request."workflowStatus" IN ('READY', 'COMPLETED') THEN 'COMPLETED'::"ProductionStatus"
    ELSE 'QUEUED'::"ProductionStatus"
  END,
  CASE WHEN request."mode" = 'READY_MODEL' THEN 'Печать по готовой модели' ELSE 'Кастомная модель согласована' END
FROM "ContactMessage" request
WHERE
  (request."mode" = 'READY_MODEL' AND request."workflowStatus" IN ('ACCEPTED', 'IN_PRODUCTION', 'READY', 'COMPLETED'))
  OR
  (request."mode" <> 'READY_MODEL' AND request."workflowStatus" IN ('IN_PRODUCTION', 'READY', 'COMPLETED'));
