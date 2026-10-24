CREATE TABLE "NotificationJob" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedUntil" TIMESTAMP(3),
  "lockToken" TEXT,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationJob_eventKey_key" ON "NotificationJob"("eventKey");
CREATE INDEX "NotificationJob_sentAt_nextAttemptAt_idx" ON "NotificationJob"("sentAt", "nextAttemptAt");
-- Match the existing application's DML permissions; it never needs DDL rights.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'printlab_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "NotificationJob" TO printlab_app;
  END IF;
END $$;
