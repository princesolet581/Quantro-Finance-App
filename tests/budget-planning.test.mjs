import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateBudgetUsage,
  getBudgetMonthRange,
  summarizeBudgetPlan,
} from "../lib/budget-planning.mjs";

test("calculates month boundaries in UTC", () => {
  const { month, start, end } = getBudgetMonthRange(
    new Date("2025-06-18T12:00:00.000Z")
  );

  assert.equal(month.toISOString(), "2025-06-01T00:00:00.000Z");
  assert.equal(start.toISOString(), "2025-06-01T00:00:00.000Z");
  assert.equal(end.toISOString(), "2025-07-01T00:00:00.000Z");
});

test("calculates category budget usage status", () => {
  const healthy = calculateBudgetUsage({ amount: 500 }, 200);
  const warning = calculateBudgetUsage({ amount: 500 }, 425);
  const over = calculateBudgetUsage({ amount: 500 }, 525);

  assert.equal(healthy.remaining, 300);
  assert.equal(healthy.status, "healthy");
  assert.equal(warning.status, "warning");
  assert.equal(over.status, "over");
});

test("summarizes budget plan totals and alerts", () => {
  const summary = summarizeBudgetPlan([
    { amount: 500, spent: 450, remaining: 50, percentUsed: 90, alertThreshold: 80 },
    { amount: 100, spent: 25, remaining: 75, percentUsed: 25, alertThreshold: 80 },
  ]);

  assert.deepEqual(summary, {
    budgeted: 600,
    spent: 475,
    remaining: 125,
    alerts: 1,
  });
});
