import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildMonthlyBaseline,
  buildScenario,
  forecastCashflow,
} from "../lib/cashflow-forecast.mjs";

const transactions = [
  { type: "INCOME", amount: 3000, date: "2025-04-01" },
  { type: "EXPENSE", amount: 2200, date: "2025-04-02" },
  { type: "INCOME", amount: 3200, date: "2025-05-01" },
  { type: "EXPENSE", amount: 2100, date: "2025-05-02" },
  { type: "EXPENSE", amount: 50, date: "2025-05-03", isRecurring: true },
];

test("builds monthly baseline", () => {
  const baseline = buildMonthlyBaseline(transactions);

  assert.equal(baseline.averageIncome, 3100);
  assert.equal(baseline.averageExpenses, 2175);
  assert.equal(baseline.averageNet, 925);
});

test("forecasts future cashflow with recurring transactions", () => {
  const forecast = forecastCashflow(transactions, {
    months: 3,
    openingBalance: 1000,
    startDate: "2025-06-01T00:00:00.000Z",
  });

  assert.equal(forecast.forecast.length, 3);
  assert.equal(forecast.forecast[0].month, "2025-06");
  assert.equal(forecast.forecast[0].recurringNet, -50);
});

test("applies scenario adjustments", () => {
  const forecast = forecastCashflow(transactions, {
    months: 1,
    openingBalance: 1000,
    startDate: "2025-06-01T00:00:00.000Z",
  });
  const scenario = buildScenario(forecast, [{ month: "2025-06", amount: -300 }]);

  assert.equal(scenario.forecast[0].adjustment, -300);
  assert.equal(
    scenario.forecast[0].scenarioNet,
    forecast.forecast[0].net - 300
  );
});
