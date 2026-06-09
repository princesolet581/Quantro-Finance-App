import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyTransactionRules,
  scoreRuleMatch,
  validateRule,
} from "../lib/transaction-rules.mjs";

test("applies matching categorization rules", () => {
  const result = applyTransactionRules(
    {
      type: "EXPENSE",
      amount: 18,
      description: "Netflix subscription",
      category: "other-expense",
    },
    [
      {
        id: "streaming",
        name: "Streaming",
        conditions: { descriptionIncludes: ["netflix"], type: "EXPENSE" },
        actions: { category: "entertainment", markRecurring: true },
      },
    ]
  );

  assert.equal(result.transaction.category, "entertainment");
  assert.equal(result.transaction.isRecurring, true);
  assert.equal(result.applied.length, 1);
});

test("scores only fully matching rules", () => {
  const score = scoreRuleMatch(
    { type: "EXPENSE", amount: 100, description: "Power bill" },
    {
      conditions: {
        type: "EXPENSE",
        descriptionIncludes: "power",
        minAmount: 50,
      },
    }
  );

  assert.ok(score >= 60);
});

test("validates rules", () => {
  assert.deepEqual(validateRule({}), [
    "Rule name is required",
    "Rule must include at least one action",
    "Rule must include at least one condition",
  ]);
});
