export function buildDebtPayoffPlan(debts, monthlyExtraPayment = 0, strategy = "avalanche") {
  const orderedDebts = orderDebts(debts, strategy).map((debt) => ({
    ...debt,
    balance: Number(debt.balance || 0),
    minimumPayment: Number(debt.minimumPayment || 0),
    apr: Number(debt.apr || 0),
  }));
  const monthlyMinimum = orderedDebts.reduce(
    (total, debt) => total + debt.minimumPayment,
    0
  );
  const monthlyBudget = monthlyMinimum + Number(monthlyExtraPayment || 0);
  const schedule = simulatePayoff(orderedDebts, monthlyBudget);

  return {
    strategy,
    monthlyMinimum,
    monthlyBudget,
    payoffMonths: schedule.length,
    totalInterest: schedule.reduce((total, month) => total + month.interest, 0),
    schedule,
  };
}

export function compareDebtStrategies(debts, monthlyExtraPayment = 0) {
  const avalanche = buildDebtPayoffPlan(debts, monthlyExtraPayment, "avalanche");
  const snowball = buildDebtPayoffPlan(debts, monthlyExtraPayment, "snowball");

  return {
    avalanche,
    snowball,
    recommended:
      avalanche.totalInterest <= snowball.totalInterest ? "avalanche" : "snowball",
    interestSaved: Math.abs(avalanche.totalInterest - snowball.totalInterest),
  };
}

function orderDebts(debts, strategy) {
  const copy = [...debts];
  if (strategy === "snowball") {
    return copy.sort((first, second) => Number(first.balance) - Number(second.balance));
  }
  return copy.sort((first, second) => Number(second.apr) - Number(first.apr));
}

function simulatePayoff(initialDebts, monthlyBudget) {
  const debts = initialDebts.map((debt) => ({ ...debt }));
  const schedule = [];
  let month = 0;

  while (debts.some((debt) => debt.balance > 0) && month < 600) {
    month += 1;
    let remainingBudget = monthlyBudget;
    let interest = 0;
    const payments = [];

    for (const debt of debts) {
      if (debt.balance <= 0) continue;
      const monthlyInterest = debt.balance * (debt.apr / 100 / 12);
      debt.balance += monthlyInterest;
      interest += monthlyInterest;
    }

    for (const debt of debts) {
      if (debt.balance <= 0 || remainingBudget <= 0) continue;
      const payment = Math.min(debt.minimumPayment, debt.balance, remainingBudget);
      debt.balance -= payment;
      remainingBudget -= payment;
      payments.push({ debtId: debt.id, payment });
    }

    for (const debt of debts) {
      if (debt.balance <= 0 || remainingBudget <= 0) continue;
      const payment = Math.min(debt.balance, remainingBudget);
      debt.balance -= payment;
      remainingBudget -= payment;
      payments.push({ debtId: debt.id, payment });
      break;
    }

    schedule.push({
      month,
      interest,
      payments,
      remainingBalance: debts.reduce((total, debt) => total + Math.max(debt.balance, 0), 0),
    });
  }

  return schedule;
}
