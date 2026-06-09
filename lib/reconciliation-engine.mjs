const DAY_MS = 24 * 60 * 60 * 1000;

export function reconcileTransactions(existingTransactions, importedTransactions, options = {}) {
  const amountTolerance = Number(options.amountTolerance ?? 0.01);
  const dateToleranceDays = Number(options.dateToleranceDays ?? 3);
  const matchedExisting = new Set();
  const matches = [];
  const unmatchedImports = [];

  for (const imported of importedTransactions) {
    const candidates = existingTransactions
      .filter((existing) => !matchedExisting.has(existing.id))
      .map((existing) =>
        scoreTransactionMatch(existing, imported, {
          amountTolerance,
          dateToleranceDays,
        })
      )
      .filter((candidate) => candidate.score >= 60)
      .sort((first, second) => second.score - first.score);

    if (candidates.length === 0) {
      unmatchedImports.push({
        transaction: imported,
        suggestedAction: "create",
      });
      continue;
    }

    const best = candidates[0];
    matchedExisting.add(best.existing.id);
    matches.push({
      existing: best.existing,
      imported,
      score: best.score,
      reasons: best.reasons,
      suggestedAction: best.score >= 90 ? "auto-match" : "review",
    });
  }

  const unmatchedExisting = existingTransactions
    .filter((existing) => !matchedExisting.has(existing.id))
    .map((transaction) => ({
      transaction,
      suggestedAction: "keep",
    }));

  return {
    matches,
    unmatchedImports,
    unmatchedExisting,
    summary: {
      imported: importedTransactions.length,
      existing: existingTransactions.length,
      autoMatched: matches.filter((match) => match.suggestedAction === "auto-match").length,
      needsReview: matches.filter((match) => match.suggestedAction === "review").length,
      shouldCreate: unmatchedImports.length,
      unmatchedExisting: unmatchedExisting.length,
    },
  };
}

export function scoreTransactionMatch(existing, imported, options = {}) {
  const amountTolerance = Number(options.amountTolerance ?? 0.01);
  const dateToleranceDays = Number(options.dateToleranceDays ?? 3);
  const reasons = [];
  let score = 0;

  if (existing.type === imported.type) {
    score += 20;
    reasons.push("same type");
  }

  const amountDiff = Math.abs(Number(existing.amount) - Number(imported.amount));
  if (amountDiff <= amountTolerance) {
    score += 35;
    reasons.push("same amount");
  } else if (amountDiff <= Math.max(1, Number(imported.amount) * 0.02)) {
    score += 15;
    reasons.push("similar amount");
  }

  const dateDiff = Math.abs(
    new Date(existing.date).getTime() - new Date(imported.date).getTime()
  );
  const dayDiff = Math.floor(dateDiff / DAY_MS);
  if (dayDiff === 0) {
    score += 25;
    reasons.push("same date");
  } else if (dayDiff <= dateToleranceDays) {
    score += 15;
    reasons.push("near date");
  }

  const descriptionScore = compareDescriptions(
    existing.description || "",
    imported.description || ""
  );
  score += descriptionScore;
  if (descriptionScore >= 15) reasons.push("similar description");

  if (existing.category && imported.category && existing.category === imported.category) {
    score += 5;
    reasons.push("same category");
  }

  return {
    existing,
    imported,
    score: Math.min(score, 100),
    reasons,
  };
}

export function compareDescriptions(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const rightSet = new Set(rightTokens);
  const intersection = leftTokens.filter((token) => rightSet.has(token));
  const union = new Set([...leftTokens, ...rightTokens]);
  const subsetSimilarity =
    intersection.length / Math.min(leftTokens.length, rightTokens.length);
  const similarity = intersection.length / union.size;

  if (subsetSimilarity >= 1) return 20;
  if (similarity >= 0.75) return 20;
  if (similarity >= 0.45) return 12;
  if (similarity >= 0.25) return 6;
  return 0;
}

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .slice(0, 12);
}
