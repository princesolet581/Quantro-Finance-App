export function forecastCashflow(transactions, options = {}) {
  const months = Number(options.months || 6);
  const startDate = options.startDate ? new Date(options.startDate) : new Date();
  const monthlyBaseline = buildMonthlyBaseline(transactions);
  const recurring = transactions.filter((transaction) => transaction.isRecurring);
  const forecast = [];
  let projectedBalance = Number(options.openingBalance || 0);

  for (let index = 0; index < months; index += 1) {
    const month = addMonths(startDate, index).toISOString().slice(0, 7);
    const baseline = monthlyBaseline.averageNet;
    const recurringNet = recurring.reduce((total, transaction) => {
      return total + signedAmount(transaction);
    }, 0);
    const net = baseline + recurringNet;
    projectedBalance += net;

    forecast.push({
      month,
      baseline,
      recurringNet,
      net,
      projectedBalance,
    });
  }

  return {
    openingBalance: Number(options.openingBalance || 0),
    monthlyBaseline,
    forecast,
    runwayMonths: forecast.findIndex((month) => month.projectedBalance < 0) + 1 || null,
  };
}

export function buildMonthlyBaseline(transactions) {
  const groups = transactions.reduce((result, transaction) => {
    const date = new Date(transaction.date);
    const key = date.toISOString().slice(0, 7);
    result[key] = result[key] || { income: 0, expenses: 0, net: 0 };
    const amount = Number(transaction.amount || 0);

    if (transaction.type === "INCOME") result[key].income += amount;
    if (transaction.type === "EXPENSE") result[key].expenses += amount;
    result[key].net = result[key].income - result[key].expenses;
    return result;
  }, {});

  const months = Object.values(groups);
  const divisor = months.length || 1;

  return {
    months: groups,
    averageIncome: months.reduce((total, month) => total + month.income, 0) / divisor,
    averageExpenses: months.reduce((total, month) => total + month.expenses, 0) / divisor,
    averageNet: months.reduce((total, month) => total + month.net, 0) / divisor,
  };
}

export function buildScenario(baseForecast, adjustments = []) {
  return {
    ...baseForecast,
    forecast: baseForecast.forecast.map((month) => {
      const adjustment = adjustments
        .filter((item) => !item.month || item.month === month.month)
        .reduce((total, item) => total + Number(item.amount || 0), 0);
      return {
        ...month,
        adjustment,
        scenarioNet: month.net + adjustment,
        scenarioProjectedBalance: month.projectedBalance + adjustment,
      };
    }),
  };
}

function signedAmount(transaction) {
  const amount = Number(transaction.amount || 0);
  return transaction.type === "EXPENSE" ? -amount : amount;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}
