import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDebtPayoffPlan,
  compareDebtStrategies,
} from "../lib/debt-payoff.mjs";

const debts = [
  { id: "card", balance: 1000, minimumPayment: 50, apr: 24 },
  { id: "loan", balance: 2500, minimumPayment: 100, apr: 8 },
];

test("builds avalanche payoff schedule", () => {
  const plan = buildDebtPayoffPlan(debts, 300, "avalanche");

  assert.equal(plan.strategy, "avalanche");
  assert.equal(plan.monthlyBudget, 450);
  assert.ok(plan.payoffMonths > 0);
  assert.equal(plan.schedule.at(-1).remainingBalance, 0);
});

test("compares debt strategies", () => {
  const comparison = compareDebtStrategies(debts, 300);

  assert.ok(["avalanche", "snowball"].includes(comparison.recommended));
  assert.ok(comparison.interestSaved >= 0);
});
