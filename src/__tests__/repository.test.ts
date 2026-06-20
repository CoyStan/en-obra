import { describe, expect, it, vi } from "vitest";
import { addExpenseMutation, createGroupMutation } from "../backend/appMutations";
import { verifyLocalDataExportPackage } from "../backend/dataExport";
import { auditAppDataIntegrity } from "../backend/dataIntegrity";
import { InMemoryBackendRepository } from "../backend/repository";
import { demoData } from "../data/demoData";
import type { AppData } from "../domain/types";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

function cloneData(): AppData {
  return JSON.parse(JSON.stringify(demoData)) as AppData;
}

describe("backend repository contract", () => {
  it("loads sanitized snapshots without leaking mutable references", async () => {
    const repository = new InMemoryBackendRepository({ data: cloneData() });
    const first = await repository.load();
    first.data.selectedGroupId = "mutated-outside";
    const second = await repository.load();

    expect(second.data.selectedGroupId).toBe("group-oaxaca");
    expect(auditAppDataIntegrity(second.data)).toEqual([]);
  });

  it("saves snapshots through the integrity guard", async () => {
    const repository = new InMemoryBackendRepository();
    const data = cloneData();
    data.selectedGroupId = "missing-group";

    const saved = await repository.save({
      data,
      account: { version: 1, mode: "guest", profile: null },
      sync: { version: 1, mode: "local-only", lastSyncedAt: null, pending: [], lastError: null },
    });

    expect(saved.data.groups.some((group) => group.id === saved.data.selectedGroupId)).toBe(true);
    expect(auditAppDataIntegrity(saved.data)).toEqual([]);
  });

  it("applies backend mutations and persists successful results", async () => {
    const repository = new InMemoryBackendRepository({ data: cloneData() });
    const result = await repository.mutate((current) =>
      createGroupMutation(current, "Casa Puebla", "Servicios y súper", {
        now: () => "2026-06-20T12:00:00Z",
        id: (prefix) => `${prefix}-repo`,
      }),
    );
    const loaded = await repository.load();

    expect(result.ok).toBe(true);
    expect(loaded.data.selectedGroupId).toBe("group-repo");
    expect(loaded.data.groups[0].name).toBe("Casa Puebla");
  });

  it("does not persist failed mutations", async () => {
    const repository = new InMemoryBackendRepository({ data: cloneData() });
    const before = await repository.load();
    const result = await repository.mutate((current) =>
      addExpenseMutation(current, "group-oaxaca", {
        title: "",
        amount: "0",
        payerId: "member-oaxaca-ana",
      }),
    );
    const after = await repository.load();

    expect(result.ok).toBe(false);
    expect(after.data.expenses).toHaveLength(before.data.expenses.length);
  });

  it("exports a verifiable local data package", async () => {
    const repository = new InMemoryBackendRepository({ data: cloneData() });
    const exportPackage = await repository.exportData("2026-06-20T12:00:00Z");

    expect(exportPackage.data.selectedGroupId).toBe("group-oaxaca");
    expect(exportPackage.sql.seedSql).toContain("INSERT INTO groups");
    expect(verifyLocalDataExportPackage(exportPackage)).toBe(true);
  });

  it("deletes local repository state back to demo data and guest account", async () => {
    const repository = new InMemoryBackendRepository({ data: cloneData() });
    await repository.mutate((current) =>
      createGroupMutation(current, "Grupo temporal", "", {
        now: () => "2026-06-20T12:00:00Z",
        id: (prefix) => `${prefix}-temp`,
      }),
    );

    const cleared = await repository.deleteLocalData("2026-06-20T12:05:00Z");

    expect(cleared.account.mode).toBe("guest");
    expect(cleared.sync.pending).toEqual([]);
    expect(cleared.data.selectedGroupId).toBe("group-oaxaca");
    expect(cleared.data.groups.some((group) => group.id === "group-temp")).toBe(false);
  });
});
