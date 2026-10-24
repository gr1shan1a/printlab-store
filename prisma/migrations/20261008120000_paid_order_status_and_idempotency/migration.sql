ALTER TYPE "OrderStatus" ADD VALUE 'PAID';

ALTER TABLE "Order" ADD COLUMN "paymentRequestKey" TEXT;
CREATE UNIQUE INDEX "Order_paymentRequestKey_key" ON "Order"("paymentRequestKey");
