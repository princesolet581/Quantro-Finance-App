export function buildAuditEvent(action, entityType, options = {}) {
  if (!action) throw new Error("Audit action is required");
  if (!entityType) throw new Error("Audit entity type is required");
  if (!options.userId) throw new Error("Audit user id is required");

  return {
    action,
    entityType,
    entityId: options.entityId || null,
    userId: options.userId,
    metadata: sanitizeMetadata(options.metadata || {}),
  };
}

export function buildImportBatchRecord(options) {
  if (!options.userId) throw new Error("Import user id is required");
  if (!options.accountId) throw new Error("Import account id is required");

  const imported = Number(options.imported || 0);
  const skipped = Number(options.skipped || 0);
  const failed = Number(options.failed || 0);

  return {
    source: options.source || "csv",
    fileName: options.fileName || null,
    imported,
    skipped,
    failed,
    status: failed > 0 && imported === 0 ? "FAILED" : "COMPLETED",
    userId: options.userId,
    accountId: options.accountId,
  };
}

export function summarizeAuditTrail(events) {
  return events.reduce(
    (summary, event) => {
      summary.total += 1;
      summary.byAction[event.action] = (summary.byAction[event.action] || 0) + 1;
      summary.byEntity[event.entityType] =
        (summary.byEntity[event.entityType] || 0) + 1;
      return summary;
    },
    { total: 0, byAction: {}, byEntity: {} }
  );
}

function sanitizeMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) => {
      if (value === undefined) return false;
      if (/password|secret|token|key/i.test(key)) return false;
      return true;
    })
  );
}
