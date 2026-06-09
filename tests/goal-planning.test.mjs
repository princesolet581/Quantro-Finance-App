import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildGoalFundingPlan,
  calculateSavingsGoalProgress,
  prioritizeGoals,
} from "../lib/goal-planning.mjs";

test("calculates savings goal progress with contributions", () => {
  const progress = calculateSavingsGoalProgress(
    { targetAmount: 1000, currentAmount: 200 },
    [{ amount: 100 }, { amount: 50 }]
  );

  assert.equal(progress.currentAmount, 350);
  assert.equal(progress.remaining, 650);
  assert.equal(progress.progress, 35);
  assert.equal(progress.isComplete, false);
});

test("builds funding plan with deadline status", () => {
  const plan = buildGoalFundingPlan(
    {
      targetAmount: 1200,
      currentAmount: 0,
      deadline: "2025-12-01T00:00:00.000Z",
    },
    200,
    new Date("2025-06-01T00:00:00.000Z")
  );

  assert.equal(plan.status, "on-track");
  assert.equal(plan.monthsRemaining, 6);
  assert.equal(plan.monthlyRequired, 200);
});

test("prioritizes goals by deadline gap and priority", () => {
  const goals = prioritizeGoals(
    [
      { id: "vacation", targetAmount: 1000, currentAmount: 900, priority: 1 },
      {
        id: "emergency",
        targetAmount: 3000,
        currentAmount: 500,
        deadline: "2025-09-01T00:00:00.000Z",
        priority: 3,
      },
    ],
    500,
    new Date("2025-06-01T00:00:00.000Z")
  );

  assert.equal(goals[0].id, "emergency");
});
