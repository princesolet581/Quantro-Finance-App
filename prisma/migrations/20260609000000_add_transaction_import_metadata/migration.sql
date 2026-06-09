-- Add metadata used to reconcile transactions imported from bank CSV statements.
ALTER TABLE "transactions"
ADD COLUMN "importId" TEXT,
ADD COLUMN "externalId" TEXT,
ADD COLUMN "importSource" TEXT,
ADD COLUMN "importedAt" TIMESTAMP(3);

CREATE INDEX "transactions_importId_idx" ON "transactions"("importId");
CREATE INDEX "transactions_accountId_date_amount_importSource_idx" ON "transactions"("accountId", "date", "amount", "importSource");
