import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_DATA_STORAGE_KEY } from "../state/storage";
import { SYNC_STORAGE_KEY } from "../state/syncStorage";
import {
  deleteLocalUserData,
  getLocalDataInventory,
  getRemoteDeletionStatus,
  LOCAL_ACCOUNT_STORAGE_KEY,
} from "../security/dataDeletion";

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(async () => undefined),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: asyncStorage,
}));

describe("data deletion model", () => {
  beforeEach(() => {
    asyncStorage.removeItem.mockClear();
  });

  it("clears every current local storage key", async () => {
    const result = await deleteLocalUserData("2026-06-10T00:00:00.000Z");

    expect(asyncStorage.removeItem).toHaveBeenCalledWith(APP_DATA_STORAGE_KEY);
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(SYNC_STORAGE_KEY);
    expect(asyncStorage.removeItem).toHaveBeenCalledWith(LOCAL_ACCOUNT_STORAGE_KEY);
    expect(result).toMatchObject({
      mode: "local-only",
      completedAt: "2026-06-10T00:00:00.000Z",
      remoteDeletion: { status: "not-configured" },
    });
    expect(result.clearedTargets.map((target) => target.id)).toEqual([
      "app-data",
      "sync-state",
      "account-state",
    ]);
  });

  it("documents current local data inventory and remote blocker", () => {
    expect(getLocalDataInventory()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ storageKey: APP_DATA_STORAGE_KEY, containsUserInput: true }),
        expect.objectContaining({ storageKey: SYNC_STORAGE_KEY }),
        expect.objectContaining({ storageKey: LOCAL_ACCOUNT_STORAGE_KEY }),
      ]),
    );
    expect(getRemoteDeletionStatus().reason).toContain("backend de produccion");
  });
});
