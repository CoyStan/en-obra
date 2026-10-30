import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EN_OBRA_DEMO_STORAGE_KEY,
  EN_OBRA_STORAGE_KEY,
} from "../keys";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  },
}));

import {
  emptyWorkspace,
  eraseAllUserData,
  loadDemoWorkspace,
  loadUserWorkspace,
} from "../enObraRepository";

describe("enObraRepository", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it("returns empty user workspace when no storage exists", async () => {
    const result = await loadUserWorkspace();
    expect(result.status).toBe("empty");
    expect(result.data).toEqual(emptyWorkspace());
  });

  it("loads demo workspace into the demo storage key", async () => {
    const result = await loadDemoWorkspace(new Date("2026-07-18T12:00:00.000Z"));
    expect(result.status).toBe("ready");
    expect(result.datasetKind).toBe("demo");
    expect(result.data.projects.length).toBeGreaterThan(0);
    expect(store.has(EN_OBRA_DEMO_STORAGE_KEY)).toBe(true);
  });

  it("erases user storage keys without touching demo storage", async () => {
    store.set(EN_OBRA_STORAGE_KEY, '{"datasetKind":"user"}');
    store.set(EN_OBRA_DEMO_STORAGE_KEY, '{"datasetKind":"demo"}');

    await eraseAllUserData();

    expect(store.has(EN_OBRA_STORAGE_KEY)).toBe(false);
    expect(store.has(EN_OBRA_DEMO_STORAGE_KEY)).toBe(true);
  });
});
