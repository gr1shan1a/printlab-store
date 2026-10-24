ALTER TABLE "Product" ADD COLUMN "printBatchSize" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Product" ADD CONSTRAINT "Product_printBatchSize_check" CHECK ("printBatchSize" >= 1 AND "printBatchSize" <= 10000);
