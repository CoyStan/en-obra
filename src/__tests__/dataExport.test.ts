import { describe, expect, it, vi } from "vitest";
import { demoData } from "../data/demoData";
import { createLocalDataExportPackage, verifyLocalDataExportPackage } from "../backend/dataExport";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { AccountState } from "../auth/types";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
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
    activeMemberByGroupId: {
      "group-oaxaca": "member-oaxaca-ana",
    },
    createdAt: "2026-06-20T10:00:00Z",
    lastSignedInAt: "2026-06-20T10:00:00Z",
  },
};

describe("local data export package", () => {
  it("packages app data, sync state, account state, inventory, and SQL snapshot", () => {
    const exportPackage = createLocalDataExportPackage({
      account,
      data: demoData,
      generatedAt: "2026-06-20T12:00:00Z",
      sync: initialSyncState,
    });

    expect(exportPackage).toMatchObject({
      version: 1,
      mode: "local-only",
      generatedAt: "2026-06-20T12:00:00Z",
      app: {
        name: "Cuentas Claras",
        defaultCurrency: "MXN",
        realPaymentsEnabled: false,
      },
      account,
      sync: initialSyncState,
      remoteDeletion: { status: "not-configured" },
    });
    expect(exportPackage.inventory.map((target) => target.id)).toEqual([
      "app-data",
      "sync-state",
      "account-state",
    ]);
    expect(exportPackage.sql.tableNames).toContain("sync_outbox");
    expect(exportPackage.sql.seedSql).toContain("INSERT INTO users");
    expect(verifyLocalDataExportPackage(exportPackage)).toBe(true);
  });

  it("creates deterministic checksums and detects changed content", () => {
    const first = createLocalDataExportPackage({
      account,
      data: demoData,
      generatedAt: "2026-06-20T12:00:00Z",
      sync: initialSyncState,
    });
    const second = createLocalDataExportPackage({
      account,
      data: demoData,
      generatedAt: "2026-06-20T12:00:00Z",
      sync: initialSyncState,
    });
    const tampered = {
      ...first,
      generatedAt: "2026-06-20T12:00:01Z",
    };

    expect(first.checksum).toBe(second.checksum);
    expect(verifyLocalDataExportPackage(tampered)).toBe(false);
  });
});
