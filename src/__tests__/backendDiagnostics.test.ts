import { describe, expect, it, vi } from "vitest";
import { createBackendDiagnosticsReport } from "../backend/backendDiagnostics";
import { createSyncOutboxItem } from "../backend/syncOutbox";
import { demoData } from "../data/demoData";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { AccountState } from "../auth/types";
import type { AppData } from "../domain/types";
import type { BackendSnapshot } from "../backend/repository";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

const account: AccountState = {
  version: 1,
  mode: "signed-in",
  profile: {
    id: "account-ana",
    displayName: "Ana",
    email: "ana@demo.local",
    provider: "local-mock",
    createdAt: "2026-06-20T10:00:00Z",
    lastSignedInAt: "2026-06-20T10:00:00Z",
  },
};

function cloneData(): AppData {
  return JSON.parse(JSON.stringify(demoData)) as AppData;
}

function snapshot(data: AppData = cloneData()): BackendSnapshot {
  return {
    account,
    data,
    sync: initialSyncState,
  };
}

describe("backend diagnostics", () => {
  it("summarizes a healthy local backend snapshot without raw user rows", () => {
    const report = createBackendDiagnosticsReport(snapshot(), "2026-06-20T12:00:00Z");
    const serialized = JSON.stringify(report);

    expect(report.status).toBe("healthy");
    expect(report.accountMode).toBe("signed-in");
    expect(report.syncMode).toBe("local-only");
    expect(report.counts.groups).toBe(demoData.groups.length);
    expect(report.counts.expenses).toBe(demoData.expenses.length);
    expect(report.integrity.issueCount).toBe(0);
    expect(report.releaseGate.status).toBe("pass");
    expect(report.releaseGate.knownBlockers).toEqual([
      "production-auth",
      "production-storage",
      "remote-deletion",
    ]);
    expect(serialized).not.toContain("Hospedaje Centro");
    expect(serialized).not.toContain("ana@demo.local");
  });

  it("reports action-needed when integrity issues exist", () => {
    const data = cloneData();
    data.selectedGroupId = "missing-group";

    const report = createBackendDiagnosticsReport(snapshot(data), "2026-06-20T12:00:00Z");

    expect(report.status).toBe("action-needed");
    expect(report.integrity.issueCount).toBeGreaterThan(0);
    expect(report.integrity.codes).toContain("selected_group_missing");
  });

  it("summarizes failed sync outbox rows without serializing payload JSON", () => {
    const data = cloneData();
    data.syncOutbox = [
      {
        ...createSyncOutboxItem({
          id: "outbox-failed",
          operation: "create",
          entityType: "expense",
          entityId: "expense-sensitive",
          payload: { title: "Cena secreta", note: "No exponer" },
          createdAt: "2026-06-20T12:00:00Z",
        }),
        attemptCount: 3,
        status: "failed",
      },
    ];

    const report = createBackendDiagnosticsReport(snapshot(data), "2026-06-20T12:00:00Z");
    const serialized = JSON.stringify(report);

    expect(report.status).toBe("action-needed");
    expect(report.syncOutbox).toEqual({
      pending: 0,
      sent: 0,
      failed: 1,
      maxAttemptCount: 3,
    });
    expect(serialized).not.toContain("Cena secreta");
    expect(serialized).not.toContain("No exponer");
  });
});
