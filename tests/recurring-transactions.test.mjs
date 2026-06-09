import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRecurringTransactionData,
  calculateNextRecurringDate,
  isTransactionDue,
} from "../lib/recurring-transactions.mjs";

test("calculates next recurring dates for supported intervals", () => {
  assert.equal(
    calculateNextRecurringDate("2025-06-01T00:00:00.000Z", "DAILY").toISOString(),
    "2025-06-02T00:00:00.000Z"
  );
  assert.equal(
    calculateNextRecurringDate("2025-06-01T00:00:00.000Z", "WEEKLY").toISOString(),
    "2025-06-08T00:00:00.000Z"
  );
  assert.equal(
    calculateNextRecurringDate("2025-06-01T00:00:00.000Z", "MONTHLY").toISOString(),
    "2025-07-01T00:00:00.000Z"
  );
  assert.equal(
    calculateNextRecurringDate("2025-06-01T00:00:00.000Z", "YEARLY").toISOString(),
    "2026-06-01T00:00:00.000Z"
  );
});

test("detects due recurring transactions", () => {
  const now = new Date("2025-06-10T00:00:00.000Z");

  assert.equal(
    isTransactionDue(
      {
        isRecurring: true,
        status: "COMPLETED",
        nextRecurringDate: new Date("2025-06-09T00:00:00.000Z"),
      },
      now
    ),
    true
  );

  assert.equal(
    isTransactionDue(
      {
        isRecurring: true,
        status: "PENDING",
        nextRecurringDate: new Date("2025-06-09T00:00:00.000Z"),
      },
      now
    ),
    false
  );
});

test("builds posted transaction data from recurring template", () => {
  const date = new Date("2025-06-10T00:00:00.000Z");
  const posted = buildRecurringTransactionData(
    {
      id: "template-1",
      type: "EXPENSE",
      amount: 25,
      description: "Streaming",
      category: "entertainment",
      userId: "user-1",
      accountId: "account-1",
    },
    date
  );

  assert.equal(posted.recurringTemplateId, "template-1");
  assert.equal(posted.isRecurring, false);
  assert.equal(posted.status, "COMPLETED");
  assert.equal(posted.description, "Streaming (Recurring)");
});
