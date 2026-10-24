ALTER TABLE "ProductionTask"
ADD COLUMN "printFileName" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ProductionTask_status_createdAt_idx"
ON "ProductionTask"("status", "createdAt");

CREATE TABLE "PrintFile" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrintFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrintFile_fileName_key" ON "PrintFile"("fileName");
