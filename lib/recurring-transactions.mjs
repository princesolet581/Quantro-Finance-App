export function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Start date must be valid");
  }

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error("Unsupported recurring interval");
  }

  return date;
}

export function isTransactionDue(transaction, now = new Date()) {
  if (!transaction?.isRecurring) return false;
  if (transaction.status && transaction.status !== "COMPLETED") return false;
  if (!transaction.nextRecurringDate && !transaction.lastProcessed) return true;
  if (!transaction.nextRecurringDate) return false;

  return new Date(transaction.nextRecurringDate) <= now;
}

export function buildRecurringTransactionData(template, date = new Date()) {
  return {
    type: template.type,
    amount: template.amount,
    description: `${template.description || "Recurring transaction"} (Recurring)`,
    date,
    category: template.category,
    userId: template.userId,
    accountId: template.accountId,
    recurringTemplateId: template.id,
    isRecurring: false,
    status: "COMPLETED",
  };
}
