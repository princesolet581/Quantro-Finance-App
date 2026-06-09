export function buildCashflowReport(transactions, options = {}) {
  const currency = options.currency || "USD";
  const normalized = transactions.map(normalizeTransaction);
  const income = sumByType(normalized, "INCOME");
  const expenses = sumByType(normalized, "EXPENSE");
  const byCategory = groupExpensesByCategory(normalized);
  const byMonth = groupCashflowByMonth(normalized);

  return {
    currency,
    totals: {
      income,
      expenses,
      net: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    },
    byCategory,
    byMonth,
    largestExpenseCategories: Object.entries(byCategory)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount })),
  };
}

export function buildAccountSnapshot(accounts, transactions) {
  const totals = accounts.reduce(
    (summary, account) => {
      const balance = Number(account.balance || 0);
      summary.balance += balance;
      summary.accounts += 1;
      if (balance < 0) summary.negativeAccounts += 1;
      return summary;
    },
    { balance: 0, accounts: 0, negativeAccounts: 0 }
  );

  const recentActivity = transactions
    .map(normalizeTransaction)
    .sort((first, second) => second.date.getTime() - first.date.getTime())
    .slice(0, 10);

  return {
    totals,
    recentActivity,
  };
}

export function exportTransactionsToCsv(transactions) {
  const headers = ["date", "type", "amount", "category", "description", "accountId"];
  const rows = transactions.map((transaction) => {
    const normalized = normalizeTransaction(transaction);
    return [
      normalized.date.toISOString().slice(0, 10),
      normalized.type,
      normalized.amount.toFixed(2),
      normalized.category,
      normalized.description,
      normalized.accountId,
    ];
  });

  return [headers, ...rows].map(toCsvRow).join("\n");
}

export function detectSpendingAnomalies(transactions, options = {}) {
  const minimumTransactions = Number(options.minimumTransactions || 3);
  const multiplier = Number(options.multiplier || 2);
  const grouped = new Map();

  for (const transaction of transactions.map(normalizeTransaction)) {
    if (transaction.type !== "EXPENSE") continue;
    const group = grouped.get(transaction.category) || [];
    group.push(transaction);
    grouped.set(transaction.category, group);
  }

  const anomalies = [];
  for (const [category, items] of grouped.entries()) {
    if (items.length < minimumTransactions) continue;

    const average = items.reduce((total, item) => total + item.amount, 0) / items.length;
    for (const item of items) {
      if (item.amount >= average * multiplier) {
        anomalies.push({
          transaction: item,
          category,
          average,
          multiplier: item.amount / average,
        });
      }
    }
  }

  return anomalies.sort((first, second) => second.multiplier - first.multiplier);
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount || 0),
    date: new Date(transaction.date),
    category: transaction.category || "uncategorized",
    description: transaction.description || "",
    accountId: transaction.accountId || "",
  };
}

function sumByType(transactions, type) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function groupExpensesByCategory(transactions) {
  return transactions.reduce((groups, transaction) => {
    if (transaction.type !== "EXPENSE") return groups;
    groups[transaction.category] = (groups[transaction.category] || 0) + transaction.amount;
    return groups;
  }, {});
}

function groupCashflowByMonth(transactions) {
  return transactions.reduce((groups, transaction) => {
    const key = transaction.date.toISOString().slice(0, 7);
    const group = groups[key] || { income: 0, expenses: 0, net: 0 };

    if (transaction.type === "INCOME") {
      group.income += transaction.amount;
    } else {
      group.expenses += transaction.amount;
    }

    group.net = group.income - group.expenses;
    groups[key] = group;
    return groups;
  }, {});
}

function toCsvRow(values) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    })
    .join(",");
}
