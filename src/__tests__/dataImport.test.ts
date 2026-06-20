import { describe, expect, it, vi } from "vitest";
import {
  type LocalDataExportPackage,
  createLocalDataExportPackage,
} from "../backend/dataExport";
import { validateLocalDataImportPackage } from "../backend/dataImport";
import { deterministicChecksum } from "../backend/checksum";
import { stablePayloadJson } from "../backend/syncOutbox";
import { demoData } from "../data/demoData";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { AccountState } from "../auth/types";
import type { AppData } from "../domain/types";

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

function exportPackage(data: AppData = cloneData()) {
  return createLocalDataExportPackage({
    account,
    data,
    generatedAt: "2026-06-20T12:00:00Z",
    sync: {
      ...initialSyncState,
      mode: "mock-sync",
      lastSyncedAt: "2026-06-20T12:01:00Z",
    },
  });
}

function withFreshChecksum(input: LocalDataExportPackage): LocalDataExportPackage {
  const { checksum: _checksum, ...body } = input;
  return {
    ...input,
    checksum: deterministicChecksum(stablePayloadJson(body)),
  };
}

describe("local data import validator", () => {
  it("restores a verified local export package into a backend snapshot", () => {
    const result = validateLocalDataImportPackage(exportPackage());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.repairedIssueCount).toBe(0);
    expect(result.snapshot.account).toEqual(account);
    expect(result.snapshot.sync.mode).toBe("mock-sync");
    expect(result.snapshot.data.selectedGroupId).toBe("group-oaxaca");
  });

  it("rejects tampered packages with invalid checksums", () => {
    const source = exportPackage();
    const tampered = {
      ...source,
      generatedAt: "2026-06-20T12:00:01Z",
    };

    expect(validateLocalDataImportPackage(tampered)).toEqual({
      ok: false,
      code: "invalid-checksum",
      error: "The local export package checksum does not match its contents.",
    });
  });

  it("rejects packages outside the local Cuentas Claras MXN boundary", () => {
    const source = withFreshChecksum({
      ...exportPackage(),
      app: {
        name: "Otra App",
        defaultCurrency: "MXN",
        realPaymentsEnabled: false,
      },
    } as unknown as LocalDataExportPackage);

    expect(validateLocalDataImportPackage(source)).toMatchObject({
      ok: false,
      code: "wrong-app",
    });
  });

  it("rejects packages that claim real payment support", () => {
    const source = withFreshChecksum({
      ...exportPackage(),
      app: {
        name: "Cuentas Claras",
        defaultCurrency: "MXN",
        realPaymentsEnabled: true,
      },
    } as unknown as LocalDataExportPackage);

    expect(validateLocalDataImportPackage(source)).toMatchObject({
      ok: false,
      code: "real-payments-enabled",
    });
  });

  it("rejects unsupported schema versions", () => {
    const source = withFreshChecksum({
      ...exportPackage(),
      sql: {
        ...exportPackage().sql,
        schemaVersion: 999,
      },
    });

    expect(validateLocalDataImportPackage(source)).toMatchObject({
      ok: false,
      code: "unsupported-schema",
    });
  });

  it("repairs importable app data before returning a snapshot", () => {
    const data = cloneData();
    data.selectedGroupId = "missing-group";
    const result = validateLocalDataImportPackage(exportPackage(data));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.repairedIssueCount).toBeGreaterThan(0);
    expect(result.snapshot.data.selectedGroupId).toBe("group-oaxaca");
  });
});
