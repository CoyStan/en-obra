import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EN_OBRA_DEMO_STORAGE_KEY,
  EN_OBRA_STORAGE_KEY,
  LEGACY_TRACKER_V1_KEY,
} from "../keys";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const key of keys) {
        store.delete(key);
      }
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

  it("migrates legacy v1 tracker storage into v2 user envelope", async () => {
    store.set(
      LEGACY_TRACKER_V1_KEY,
      JSON.stringify({
        version: 1,
        demoRevision: 2,
        activeProjectId: "project-1",
        projects: [
          {
            id: "project-1",
            name: "Obra piloto",
            clientName: "Ana",
            clientPhone: "525512345678",
            address: "Roma",
            service: "Jardín",
            startedOn: "2026-07-18",
          },
        ],
        suppliers: [
          {
            id: "supplier-1",
            name: "Ferretería",
            phone: "525598765432",
            category: "Materiales",
            lastContactNote: "",
          },
        ],
        materials: [
          {
            id: "material-1",
            projectId: "project-1",
            supplierId: "supplier-1",
            name: "Cemento",
            quantity: "10 sacos",
            priceCents: 120000,
            status: "ordered",
            paymentStatus: "pending",
            createdAt: "2026-07-18T09:00:00.000Z",
            updatedAt: "2026-07-18T09:00:00.000Z",
          },
        ],
      }),
    );

    const result = await loadUserWorkspace();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      return;
    }
    expect(result.migrated).toBe(true);
    expect(result.data.projects[0]?.name).toBe("Obra piloto");
    expect(store.has(EN_OBRA_STORAGE_KEY)).toBe(true);
  });

  it("erases user storage keys without touching demo storage", async () => {
    store.set(EN_OBRA_STORAGE_KEY, '{"datasetKind":"user"}');
    store.set(LEGACY_TRACKER_V1_KEY, '{"version":1}');
    store.set(EN_OBRA_DEMO_STORAGE_KEY, '{"datasetKind":"demo"}');

    await eraseAllUserData();

    expect(store.has(EN_OBRA_STORAGE_KEY)).toBe(false);
    expect(store.has(LEGACY_TRACKER_V1_KEY)).toBe(false);
    expect(store.has(EN_OBRA_DEMO_STORAGE_KEY)).toBe(true);
  });
});
