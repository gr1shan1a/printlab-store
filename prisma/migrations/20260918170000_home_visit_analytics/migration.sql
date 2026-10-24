-- Анонимная first-party статистика посещений главной страницы.
CREATE TABLE "HomeVisitor" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeVisitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomeVisit" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeVisit_createdAt_idx" ON "HomeVisit"("createdAt");
CREATE INDEX "HomeVisit_visitorId_createdAt_idx" ON "HomeVisit"("visitorId", "createdAt");
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "HomeVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
