import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildAuditEvent,
  buildImportBatchRecord,
  summarizeAuditTrail,
} from "../lib/audit-log.mjs";

test("builds audit events and removes sensitive metadata", () => {
  const event = buildAuditEvent("created", "transaction", {
    userId: "user-1",
    entityId: "txn-1",
    metadata: {
      amount: 25,
      apiToken: "secret",
    },
  });

  assert.equal(event.action, "created");
  assert.equal(event.entityId, "txn-1");
  assert.deepEqual(event.metadata, { amount: 25 });
});

test("builds import batch status from counts", () => {
  const completed = buildImportBatchRecord({
    userId: "user-1",
    accountId: "account-1",
    imported: 10,
    failed: 2,
  });
  const failed = buildImportBatchRecord({
    userId: "user-1",
    accountId: "account-1",
    imported: 0,
    failed: 2,
  });

  assert.equal(completed.status, "COMPLETED");
  assert.equal(failed.status, "FAILED");
});

test("summarizes audit trail by action and entity", () => {
  const summary = summarizeAuditTrail([
    { action: "created", entityType: "transaction" },
    { action: "created", entityType: "budget" },
    { action: "deleted", entityType: "transaction" },
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.byAction.created, 2);
  assert.equal(summary.byEntity.transaction, 2);
});
