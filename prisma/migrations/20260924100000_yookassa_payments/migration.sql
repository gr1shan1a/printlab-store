CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

ALTER TABLE "Order"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "paymentId" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_paymentId_key" ON "Order"("paymentId");