ALTER TABLE "transactions"
ADD COLUMN "recurringTemplateId" TEXT;

CREATE INDEX "transactions_recurringTemplateId_idx" ON "transactions"("recurringTemplateId");
