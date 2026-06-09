import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildImportDuplicateKey,
  parseTransactionCsv,
} from "../lib/transaction-import.mjs";

test("parses signed amount CSV rows into normalized transactions", () => {
  const csv = [
    "date,description,amount,category",
    "2025-06-01,Grocery Store,-42.15,groceries",
    "2025-06-02,Payroll,2500,salary",
  ].join("\n");

  const { transactions, errors } = parseTransactionCsv(csv);

  assert.equal(errors.length, 0);
  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].type, "EXPENSE");
  assert.equal(transactions[0].amount, 42.15);
  assert.equal(transactions[0].category, "groceries");
  assert.equal(transactions[1].type, "INCOME");
  assert.equal(transactions[1].amount, 2500);
});

test("parses debit and credit columns", () => {
  const csv = [
    "date,description,debit,credit",
    "2025-06-01,Restaurant,18.75,",
    "2025-06-03,Refund,,12.5",
  ].join("\n");

  const { transactions } = parseTransactionCsv(csv);

  assert.equal(transactions[0].type, "EXPENSE");
  assert.equal(transactions[0].amount, 18.75);
  assert.equal(transactions[0].category, "other-expense");
  assert.equal(transactions[1].type, "INCOME");
  assert.equal(transactions[1].amount, 12.5);
  assert.equal(transactions[1].category, "other-income");
});

test("returns row-level validation errors without dropping valid rows", () => {
  const csv = [
    "date,description,amount",
    "2025-06-01,Valid Expense,-10",
    "not-a-date,Broken Row,-5",
  ].join("\n");

  const { transactions, errors } = parseTransactionCsv(csv);

  assert.equal(transactions.length, 1);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].row, 3);
  assert.match(errors[0].message, /valid date/);
});

test("builds stable duplicate keys across equivalent descriptions", () => {
  const date = new Date("2025-06-01T12:00:00.000Z");
  const first = buildImportDuplicateKey({
    date,
    type: "EXPENSE",
    amount: 12,
    description: "Coffee Shop",
    importSource: "csv",
  });
  const second = buildImportDuplicateKey({
    date,
    type: "EXPENSE",
    amount: 12,
    description: "coffee shop",
    importSource: "CSV",
  });

  assert.equal(first, second);
});
