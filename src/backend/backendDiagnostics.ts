import { auditAppDataIntegrity } from "./dataIntegrity";
import { createBackendReleaseGateReport } from "./backendReleaseGate";
import type { BackendSnapshot } from "./repository";

export type BackendDiagnosticsStatus = "healthy" | "action-needed";

export type BackendDiagnosticsReport = {
  generatedAt: string;
  status: BackendDiagnosticsStatus;
  accountMode: BackendSnapshot["account"]["mode"];
  syncMode: BackendSnapshot["sync"]["mode"];
  counts: {
    users: number;
    groups: number;
    groupMembers: number;
    expenses: number;
    expenseParticipants: number;
    settlements: number;
    activityEvents: number;
    syncOutbox: number;
  };
  syncOutbox: {
    pending: number;
    sent: number;
    failed: number;
    maxAttemptCount: number;
  };
  integrity: {
    issueCount: number;
    fatalCount: number;
    repairableCount: number;
    codes: string[];
  };
  releaseGate: {
    status: "pass" | "fail";
    knownBlockers: string[];
    unexpectedBlockers: string[];
  };
};

function countByStatus(items: NonNullable<BackendSnapshot["data"]["syncOutbox"]>, status: "pending" | "sent" | "failed") {
  return items.filter((item) => item.status === status).length;
}

export function createBackendDiagnosticsReport(
  snapshot: BackendSnapshot,
  generatedAt: string,
): BackendDiagnosticsReport {
  const issues = auditAppDataIntegrity(snapshot.data);
  const outbox = snapshot.data.syncOutbox ?? [];
  const releaseGate = createBackendReleaseGateReport(generatedAt);
  const fatalCount = issues.filter((issue) => issue.severity === "fatal").length;
  const repairableCount = issues.filter((issue) => issue.severity === "repairable").length;
  const failedOutboxCount = countByStatus(outbox, "failed");
  const status: BackendDiagnosticsStatus =
    fatalCount || repairableCount || failedOutboxCount || releaseGate.status === "fail"
      ? "action-needed"
      : "healthy";

  return {
    generatedAt,
    status,
    accountMode: snapshot.account.mode,
    syncMode: snapshot.sync.mode,
    counts: {
      users: snapshot.data.users?.length ?? 0,
      groups: snapshot.data.groups.length,
      groupMembers: snapshot.data.groupMembers?.length ?? 0,
      expenses: snapshot.data.expenses.length,
      expenseParticipants: snapshot.data.expenseParticipants?.length ?? 0,
      settlements: snapshot.data.settlements.length,
      activityEvents: snapshot.data.activityEvents?.length ?? 0,
      syncOutbox: outbox.length,
    },
    syncOutbox: {
      pending: countByStatus(outbox, "pending"),
      sent: countByStatus(outbox, "sent"),
      failed: failedOutboxCount,
      maxAttemptCount: outbox.reduce((max, item) => Math.max(max, item.attemptCount), 0),
    },
    integrity: {
      issueCount: issues.length,
      fatalCount,
      repairableCount,
      codes: Array.from(new Set(issues.map((issue) => issue.code))).sort(),
    },
    releaseGate: {
      status: releaseGate.status,
      knownBlockers: releaseGate.knownBlockers,
      unexpectedBlockers: releaseGate.unexpectedBlockers,
    },
  };
}
