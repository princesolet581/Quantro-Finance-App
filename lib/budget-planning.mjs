export function getBudgetMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getBudgetMonthRange(date = new Date()) {
  const month = getBudgetMonth(date);
  const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));

  return {
    month,
    start: month,
    end: nextMonth,
  };
}

export function calculateBudgetUsage(budget, spent) {
  const amount = Number(budget?.amount || 0);
  const actualSpent = Number(spent || 0);
  const remaining = amount - actualSpent;
  const percentUsed = amount > 0 ? (actualSpent / amount) * 100 : 0;

  return {
    amount,
    spent: actualSpent,
    remaining,
    percentUsed,
    status: getBudgetStatus(percentUsed),
  };
}

export function summarizeBudgetPlan(items) {
  return items.reduce(
    (summary, item) => {
      summary.budgeted += item.amount;
      summary.spent += item.spent;
      summary.remaining += item.remaining;
      if (item.percentUsed >= item.alertThreshold) {
        summary.alerts += 1;
      }
      return summary;
    },
    { budgeted: 0, spent: 0, remaining: 0, alerts: 0 }
  );
}

function getBudgetStatus(percentUsed) {
  if (percentUsed >= 100) return "over";
  if (percentUsed >= 80) return "warning";
  return "healthy";
}
