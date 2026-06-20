import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AsyncStorageBackendRepository,
  asyncStorageBackendRepositoryKeys,
} from "../backend/asyncStorageRepository";
import { addExpenseMutation, createGroupMutation } from "../backend/appMutations";
import { verifyLocalDataExportPackage } from "../backend/dataExport";
import { auditAppDataIntegrity } from "../backend/dataIntegrity";
import { demoData } from "../data/demoData";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { AccountState } from "../auth/types";
import type { AppData } from "../domain/types";

const asyncStorage = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
  };
});

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: asyncStorage,
}));

const account: AccountState = {
  version: 1,
  mode: "signed-in",
  profile: {
    id: "account-test",
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

describe("AsyncStorage backend repository", () => {
  beforeEach(() => {
    asyncStorage.store.clear();
    asyncStorage.getItem.mockClear();
    asyncStorage.removeItem.mockClear();
    asyncStorage.setItem.mockClear();
  });

  it("loads demo data, guest account, and initial sync state from empty storage", async () => {
    const repository = new AsyncStorageBackendRepository();
    const snapshot = await repository.load();

    expect(snapshot.account.mode).toBe("guest");
    expect(snapshot.data.selectedGroupId).toBe("group-oaxaca");
    expect(snapshot.sync).toEqual(initialSyncState);
  });

  it("saves and reloads app, account, and sync state through known storage keys", async () => {
    const repository = new AsyncStorageBackendRepository();
    const data = cloneData();
    data.selectedGroupId = "group-roma";

    await repository.save({
      account,
      data,
      sync: {
        ...initialSyncState,
        mode: "mock-sync",
        lastSyncedAt: "2026-06-20T10:05:00Z",
      },
    });
    const loaded = await repository.load();

    expect(asyncStorage.setItem).toHaveBeenCalledWith(asyncStorageBackendRepositoryKeys.data, expect.any(String));
    expect(asyncStorage.setItem).toHaveBeenCalledWith(asyncStorageBackendRepositoryKeys.account, expect.any(String));
    expect(asyncStorage.setItem).toHaveBeenCalledWith(asyncStorageBackendRepositoryKeys.sync, expect.any(String));
    expect(loaded.account).toEqual(account);
    expect(loaded.data.selectedGroupId).toBe("group-roma");
    expect(loaded.sync.mode).toBe("mock-sync");
  });

  it("repairs corrupted saved app data on save", async () => {
    const repository = new AsyncStorageBackendRepository();
    const data = cloneData();
    data.selectedGroupId = "missing-group";

    const saved = await repository.save({
      account,
      data,
      sync: initialSyncState,
    });

    expect(saved.data.selectedGroupId).toBe("group-oaxaca");
    expect(auditAppDataIntegrity(saved.data)).toEqual([]);
  });

  it("persists successful mutations and leaves failed mutations untouched", async () => {
    const repository = new AsyncStorageBackendRepository();
    await repository.save({ account, data: cloneData(), sync: initialSyncState });

    const created = await repository.mutate((current) =>
      createGroupMutation(current, "Casa Queretaro", "Servicios compartidos", {
        now: () => "2026-06-20T12:00:00Z",
        id: (prefix) => `${prefix}-async`,
      }),
    );
    const failed = await repository.mutate((current) =>
      addExpenseMutation(current, "group-async", {
        title: "",
        amount: "0",
        payerId: "member-async",
      }),
    );
    const loaded = await repository.load();

    expect(created.ok).toBe(true);
    expect(failed.ok).toBe(false);
    expect(loaded.data.groups[0].id).toBe("group-async");
    expect(loaded.data.expenses.some((expense) => expense.id === "expense-async")).toBe(false);
  });

  it("exports a verifiable package from persisted local state", async () => {
    const repository = new AsyncStorageBackendRepository();
    await repository.save({ account, data: cloneData(), sync: initialSyncState });

    const exportPackage = await repository.exportData("2026-06-20T12:00:00Z");

    expect(exportPackage.account).toEqual(account);
    expect(exportPackage.sql.seedSql).toContain("INSERT INTO users");
    expect(verifyLocalDataExportPackage(exportPackage)).toBe(true);
  });

  it("deletes local app, account, and sync storage keys", async () => {
    const repository = new AsyncStorageBackendRepository();
    await repository.save({ account, data: cloneData(), sync: initialSyncState });

    const cleared = await repository.deleteLocalData("2026-06-20T12:05:00Z");

    expect(asyncStorage.removeItem).toHaveBeenCalledWith(asyncStorageBackendRepositoryKeys.data);
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(asyncStorageBackendRepositoryKeys.account);
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(asyncStorageBackendRepositoryKeys.sync);
    expect(cleared.account.mode).toBe("guest");
    expect(cleared.data.selectedGroupId).toBe("group-oaxaca");
    expect(cleared.sync).toEqual(initialSyncState);
  });
});
