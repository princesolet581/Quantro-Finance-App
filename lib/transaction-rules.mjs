export function applyTransactionRules(transaction, rules) {
  const matchedRules = rules
    .filter((rule) => rule.enabled !== false)
    .map((rule) => ({
      rule,
      score: scoreRuleMatch(transaction, rule),
    }))
    .filter((match) => match.score > 0)
    .sort((first, second) => second.score - first.score);

  const updated = { ...transaction };
  const applied = [];

  for (const match of matchedRules) {
    Object.assign(updated, buildRulePatch(updated, match.rule));
    applied.push({
      id: match.rule.id,
      name: match.rule.name,
      score: match.score,
    });
    if (match.rule.stopProcessing) break;
  }

  return {
    transaction: updated,
    applied,
  };
}

export function scoreRuleMatch(transaction, rule) {
  let score = 0;
  const conditions = rule.conditions || {};

  if (conditions.type && conditions.type !== transaction.type) return 0;
  if (conditions.accountId && conditions.accountId !== transaction.accountId) return 0;
  if (conditions.minAmount && Number(transaction.amount) < Number(conditions.minAmount)) return 0;
  if (conditions.maxAmount && Number(transaction.amount) > Number(conditions.maxAmount)) return 0;

  if (conditions.descriptionIncludes) {
    const haystack = String(transaction.description || "").toLowerCase();
    const needles = [].concat(conditions.descriptionIncludes).map((value) =>
      String(value).toLowerCase()
    );
    if (!needles.some((needle) => haystack.includes(needle))) return 0;
    score += 50;
  }

  if (conditions.merchant) {
    const merchant = String(transaction.description || "").toLowerCase();
    if (!merchant.includes(String(conditions.merchant).toLowerCase())) return 0;
    score += 30;
  }

  if (conditions.category && conditions.category === transaction.category) score += 20;
  if (conditions.type) score += 10;
  if (conditions.accountId) score += 10;
  if (conditions.minAmount || conditions.maxAmount) score += 10;

  return score;
}

export function validateRule(rule) {
  const errors = [];
  if (!rule.name) errors.push("Rule name is required");
  if (!rule.actions || Object.keys(rule.actions).length === 0) {
    errors.push("Rule must include at least one action");
  }
  if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
    errors.push("Rule must include at least one condition");
  }
  return errors;
}

function buildRulePatch(transaction, rule) {
  const actions = rule.actions || {};
  const patch = {};

  if (actions.category) patch.category = actions.category;
  if (actions.descriptionPrefix) {
    patch.description = `${actions.descriptionPrefix}${transaction.description || ""}`;
  }
  if (actions.descriptionSuffix) {
    patch.description = `${patch.description || transaction.description || ""}${actions.descriptionSuffix}`;
  }
  if (actions.markRecurring !== undefined) patch.isRecurring = Boolean(actions.markRecurring);

  return patch;
}
