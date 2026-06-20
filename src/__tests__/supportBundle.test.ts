import { describe, expect, it, vi } from "vitest";
import type { AccountState } from "../auth/types";
import { createRedactedSupportBundle } from "../backend/supportBundle";
import { createSyncOutboxItem } from "../backend/syncOutbox";
import type { BackendSnapshot } from "../backend/repository";
import { demoData } from "../data/demoData";
import { initialSyncState } from "../sync/localSyncAdapter";
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

function snapshot(): BackendSnapshot {
  const data = cloneData();
  data.syncOutbox = [
    {
      ...createSyncOutboxItem({
        id: "outbox-sensitive",
        operation: "create",
        entityType: "expense",
        entityId: "expense-sensitive",
        payload: { title: "Cena secreta", note: "No exponer" },
        createdAt: "2026-06-20T12:00:00Z",
      }),
      attemptCount: 2,
      status: "failed",
    },
  ];

  return {
    account,
    data,
    sync: initialSyncState,
  };
}

const releaseConfig = {
  dependencies: {
    expo: "56.0.0",
    react: "19.2.7",
  },
  devDependencies: {
    vitest: "4.1.8",
  },
  androidPermissions: [],
};

describe("redacted support bundle", () => {
  it("aggregates backend support signals without raw account, expense, or outbox content", () => {
    const bundle = createRedactedSupportBundle(snapshot(), "2026-06-20T12:00:00Z", releaseConfig);
    const serialized = JSON.stringify(bundle);

    expect(bundle.target).toBe("play-internal-testing");
    expect(bundle.redaction).toEqual({
      rawUserRowsIncluded: false,
      rawExpenseRowsIncluded: false,
      rawOutboxPayloadsIncluded: false,
      accountContactIncluded: false,
    });
    expect(bundle.diagnostics.syncOutbox.failed).toBe(1);
    expect(bundle.preflight.status).toBe("ready-for-internal-testing");
    expect(bundle.releaseManifest.realPaymentsEnabled).toBe(false);
    expect(bundle.privacy.scan.status).toBe("pass");
    expect(bundle.privacy.dataSafety.handlingByCategory["financial-info"]).toBe("local-only");

    expect(serialized).not.toContain("ana@demo.local");
    expect(serialized).not.toContain("Hospedaje Centro");
    expect(serialized).not.toContain("Cena secreta");
    expect(serialized).not.toContain("No exponer");
    expect(serialized).not.toContain("payloadJson");
  });

  it("surfaces privacy scan failures without exposing raw app rows", () => {
    const bundle = createRedactedSupportBundle(snapshot(), "2026-06-20T12:00:00Z", {
      dependencies: { "@stripe/stripe-react-native": "1.0.0" },
      devDependencies: {},
      androidPermissions: ["ACCESS_FINE_LOCATION"],
    });

    expect(bundle.privacy.scan.status).toBe("fail");
    expect(bundle.privacy.scan.risks.map((risk) => risk.kind)).toEqual([
      "payments-sdk",
      "android-permission",
    ]);
    expect(JSON.stringify(bundle)).not.toContain("ana@demo.local");
  });
});
