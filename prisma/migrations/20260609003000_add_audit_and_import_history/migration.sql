CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE "import_batches" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "fileName" TEXT,
  "imported" INTEGER NOT NULL DEFAULT 0,
  "skipped" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "status" "ImportStatus" NOT NULL DEFAULT 'COMPLETED',
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_batches_userId_createdAt_idx" ON "import_batches"("userId", "createdAt");
CREATE INDEX "import_batches_accountId_idx" ON "import_batches"("accountId");
CREATE INDEX "audit_events_userId_createdAt_idx" ON "audit_events"("userId", "createdAt");
CREATE INDEX "audit_events_entityType_entityId_idx" ON "audit_events"("entityType", "entityId");

ALTER TABLE "import_batches"
ADD CONSTRAINT "import_batches_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "import_batches"
ADD CONSTRAINT "import_batches_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_events"
ADD CONSTRAINT "audit_events_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
