import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildAccountSnapshot,
  buildCashflowReport,
  detectSpendingAnomalies,
  exportTransactionsToCsv,
} from "../lib/financial-reporting.mjs";

const transactions = [
  {
    id: "t1",
    type: "INCOME",
    amount: 3000,
    date: "2025-06-01",
    category: "salary",
    description: "Payroll",
    accountId: "a1",
  },
  {
    id: "t2",
    type: "EXPENSE",
    amount: 500,
    date: "2025-06-02",
    category: "housing",
    description: "Rent",
    accountId: "a1",
  },
  {
    id: "t3",
    type: "EXPENSE",
    amount: 50,
    date: "2025-06-03",
    category: "food",
    description: "Cafe, downtown",
    accountId: "a1",
  },
  {
    id: "t4",
    type: "EXPENSE",
    amount: 20,
    date: "2025-06-04",
    category: "food",
    description: "Snack",
    accountId: "a1",
  },
  {
    id: "t5",
    type: "EXPENSE",
    amount: 200,
    date: "2025-06-05",
    category: "food",
    description: "Dinner",
    accountId: "a1",
  },
];

test("builds cashflow report totals and category ranking", () => {
  const report = buildCashflowReport(transactions);

  assert.equal(report.totals.income, 3000);
  assert.equal(report.totals.expenses, 770);
  assert.equal(report.totals.net, 2230);
  assert.equal(report.byCategory.food, 270);
  assert.equal(report.largestExpenseCategories[0].category, "housing");
});

test("exports transactions to CSV with escaped descriptions", () => {
  const csv = exportTransactionsToCsv(transactions);

  assert.match(csv, /date,type,amount,category,description,accountId/);
  assert.match(csv, /"Cafe, downtown"/);
});

test("detects spending anomalies by category", () => {
  const anomalies = detectSpendingAnomalies(transactions, {
    minimumTransactions: 3,
    multiplier: 2,
  });

  assert.equal(anomalies.length, 1);
  assert.equal(anomalies[0].transaction.id, "t5");
});

test("builds account snapshot totals", () => {
  const snapshot = buildAccountSnapshot(
    [
      { id: "a1", balance: 1000 },
      { id: "a2", balance: -50 },
    ],
    transactions
  );

  assert.equal(snapshot.totals.balance, 950);
  assert.equal(snapshot.totals.negativeAccounts, 1);
  assert.equal(snapshot.recentActivity[0].id, "t5");
});
