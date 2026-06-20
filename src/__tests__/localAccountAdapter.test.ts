import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_STORAGE_KEY, localAccountAdapter } from "../auth/localAccountAdapter";

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn(),
  removeItem: vi.fn(async () => undefined),
  setItem: vi.fn(async () => undefined),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: asyncStorage,
}));

describe("local account adapter", () => {
  beforeEach(() => {
    asyncStorage.getItem.mockReset();
    asyncStorage.removeItem.mockClear();
    asyncStorage.setItem.mockClear();
  });

  it("clears local account state without creating a remote deletion promise", async () => {
    const state = await localAccountAdapter.clearLocalAccount();

    expect(asyncStorage.removeItem).toHaveBeenCalledWith(ACCOUNT_STORAGE_KEY);
    expect(state).toEqual({
      mode: "guest",
      profile: null,
      version: 1,
    });
  });
});
