import assert from "node:assert/strict";
import { test } from "node:test";

import {
  compareDescriptions,
  reconcileTransactions,
  scoreTransactionMatch,
} from "../lib/reconciliation-engine.mjs";

test("scores strong matches from date amount type and description", () => {
  const result = scoreTransactionMatch(
    {
      id: "existing-1",
      type: "EXPENSE",
      amount: 42.15,
      date: "2025-06-01",
      description: "Grocery Store Main",
      category: "groceries",
    },
    {
      type: "EXPENSE",
      amount: 42.15,
      date: "2025-06-01",
      description: "Grocery Store",
      category: "groceries",
    }
  );

  assert.equal(result.score, 100);
  assert.ok(result.reasons.includes("same amount"));
  assert.ok(result.reasons.includes("same date"));
});

test("reconciles imports into auto matches, review matches, and creates", () => {
  const existing = [
    {
      id: "e1",
      type: "EXPENSE",
      amount: 42.15,
      date: "2025-06-01",
      description: "Grocery Store",
      category: "groceries",
    },
    {
      id: "e2",
      type: "EXPENSE",
      amount: 10,
      date: "2025-06-04",
      description: "Coffee",
      category: "food",
    },
  ];
  const imported = [
    {
      type: "EXPENSE",
      amount: 42.15,
      date: "2025-06-01",
      description: "Grocery Store",
      category: "groceries",
    },
    {
      type: "EXPENSE",
      amount: 11,
      date: "2025-06-05",
      description: "Coffee Shop",
      category: "food",
    },
    {
      type: "INCOME",
      amount: 2500,
      date: "2025-06-10",
      description: "Payroll",
      category: "salary",
    },
  ];

  const result = reconcileTransactions(existing, imported);

  assert.equal(result.summary.autoMatched, 1);
  assert.equal(result.summary.needsReview, 1);
  assert.equal(result.summary.shouldCreate, 1);
});

test("compares merchant descriptions without punctuation noise", () => {
  assert.equal(compareDescriptions("ACME MARKET #104", "Acme Market"), 20);
});
