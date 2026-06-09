const REQUIRED_HEADERS = ["date", "description"];
const VALID_TYPES = new Set(["INCOME", "EXPENSE"]);
const DEFAULT_SOURCE = "csv";
const DEFAULT_EXPENSE_CATEGORY = "other-expense";
const DEFAULT_INCOME_CATEGORY = "other-income";

export function parseCsvRows(csvText) {
  if (typeof csvText !== "string" || !csvText.trim()) {
    throw new Error("CSV file is empty");
  }

  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(current.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some((value) => value !== "")) rows.push(row);

  return rows;
}

export function parseTransactionCsv(csvText, options = {}) {
  const rows = parseCsvRows(csvText);
  const headers = rows[0].map(normalizeHeader);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(", ")}`);
  }

  const transactions = [];
  const errors = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const values = Object.fromEntries(
      headers.map((header, index) => [header, row[index]?.trim() || ""])
    );

    try {
      transactions.push(normalizeImportedTransaction(values, options));
    } catch (error) {
      errors.push({ row: rowNumber, message: error.message });
    }
  });

  if (transactions.length === 0 && errors.length === 0) {
    throw new Error("CSV file does not contain any transaction rows");
  }

  return { transactions, errors };
}

export function normalizeImportedTransaction(row, options = {}) {
  const date = parseTransactionDate(row.date);
  const rawDescription = row.description || row.memo || row.name;
  const description = rawDescription?.trim();

  if (!description) {
    throw new Error("Description is required");
  }

  const signedAmount = getSignedAmount(row);
  const type = getTransactionType(row, signedAmount);
  const amount = Math.abs(signedAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const source = (row.source || options.source || DEFAULT_SOURCE).trim();
  const category = getCategory(row.category, type);

  return {
    type,
    amount,
    description,
    date,
    category,
    importSource: source,
    externalId: row.id || row.transaction_id || row.external_id || null,
  };
}

export function buildImportDuplicateKey(transaction) {
  return [
    transaction.date.toISOString().slice(0, 10),
    transaction.type,
    transaction.amount.toFixed(2),
    transaction.description.toLowerCase(),
    transaction.importSource.toLowerCase(),
  ].join("|");
}

function normalizeHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseTransactionDate(value) {
  if (!value) throw new Error("Date is required");

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Date must be a valid date");
  }

  if (parsed > new Date()) {
    throw new Error("Date cannot be in the future");
  }

  return parsed;
}

function getSignedAmount(row) {
  if (row.amount) return parseMoney(row.amount);

  const debit = row.debit ? parseMoney(row.debit) : 0;
  const credit = row.credit ? parseMoney(row.credit) : 0;

  if (debit && credit) {
    throw new Error("Use either debit or credit, not both");
  }

  if (debit) return -Math.abs(debit);
  if (credit) return Math.abs(credit);

  throw new Error("Amount is required");
}

function parseMoney(value) {
  const normalized = value.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const parsed = Number.parseFloat(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Amount must be a valid number");
  }

  return parsed;
}

function getTransactionType(row, signedAmount) {
  if (!row.type) return signedAmount < 0 ? "EXPENSE" : "INCOME";

  const type = row.type.trim().toUpperCase();
  if (!VALID_TYPES.has(type)) {
    throw new Error("Type must be INCOME or EXPENSE");
  }

  return type;
}

function getCategory(category, type) {
  if (category?.trim()) return category.trim();

  return type === "EXPENSE" ? DEFAULT_EXPENSE_CATEGORY : DEFAULT_INCOME_CATEGORY;
}
