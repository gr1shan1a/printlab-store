ALTER TABLE "User"
ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "loginLockedUntil" TIMESTAMP(3);

CREATE TABLE "ApiRateLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "ApiRateLimit_resetAt_idx" ON "ApiRateLimit"("resetAt");

CREATE TABLE "CaptchaChallenge" (
  "id" TEXT NOT NULL,
  "answerHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaptchaChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CaptchaChallenge_expiresAt_idx" ON "CaptchaChallenge"("expiresAt");
