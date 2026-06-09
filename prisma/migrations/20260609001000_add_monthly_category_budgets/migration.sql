CREATE TABLE "monthly_budgets" (
  "id" TEXT NOT NULL,
  "month" TIMESTAMP(3) NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "spent" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "rollover" BOOLEAN NOT NULL DEFAULT false,
  "alertThreshold" INTEGER NOT NULL DEFAULT 80,
  "lastAlertSent" TIMESTAMP(3),
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monthly_budgets_userId_month_category_key" ON "monthly_budgets"("userId", "month", "category");
CREATE INDEX "monthly_budgets_userId_month_idx" ON "monthly_budgets"("userId", "month");

ALTER TABLE "monthly_budgets"
ADD CONSTRAINT "monthly_budgets_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
