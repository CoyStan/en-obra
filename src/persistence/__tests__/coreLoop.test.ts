import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyStatusChange, latestReceiptDate, urgency } from "../../domain/en-obra/status";
import { createMaterialRecord } from "../../domain/en-obra/materials";
import { createProjectRecord } from "../../domain/en-obra/projects";
import { createDemoData } from "../../domain/en-obra/demo";
import { toClientSnapshot } from "../../domain/en-obra/clientSnapshot";
import { buildClientMessage, buildSupplierMessage, clientUpdateMessage, waMeUrl } from "../../domain/en-obra/whatsapp";
import { formatPhoneDisplay, isValidPhoneForWhatsApp, normalizePhoneToE164, toWaMeDigits } from "../../domain/en-obra/phone";
import type { Material } from "../../domain/en-obra/types";
import {
  EN_OBRA_DEMO_STORAGE_KEY,
  EN_OBRA_RECOVERY_KEY,
  EN_OBRA_STORAGE_KEY,
} from "../keys";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const key of keys) store.delete(key);
    }),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createWriteQueue,
  loadUserWorkspace,
  loadDemoWorkspace,
  emptyWorkspace,
} from "../enObraRepository";

describe("en obra core loop", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key: string) => store.get(key) ?? null);
    vi.mocked(AsyncStorage.setItem).mockImplementation(async (key: string, value: string) => {
      store.set(key, value);
    });
  });

  it("empty first launch does not invent demo into user storage", async () => {
    const result = await loadUserWorkspace();
    expect(result.status).toBe("empty");
    expect(result.data.projects).toEqual([]);
    expect(store.has(EN_OBRA_STORAGE_KEY)).toBe(false);
  });

  it("demo and user namespaces stay separate", async () => {
    await loadDemoWorkspace(new Date("2026-07-18T12:00:00Z"));
    expect(store.has(EN_OBRA_DEMO_STORAGE_KEY)).toBe(true);
    expect(store.has(EN_OBRA_STORAGE_KEY)).toBe(false);
    const user = await loadUserWorkspace();
    expect(user.status).toBe("empty");
  });

  it("malformed JSON preserves recovery copy and blocks mutations", async () => {
    store.set(EN_OBRA_STORAGE_KEY, "{not-json");
    const result = await loadUserWorkspace();
    expect(result.status).toBe("corrupt");
    expect(result.mutationsBlocked).toBe(true);
    expect(store.get(EN_OBRA_RECOVERY_KEY)).toBe("{not-json");
  });

  it("AsyncStorage read failure blocks mutations", async () => {
    vi.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error("disk"));
    const result = await loadUserWorkspace();
    expect(result.status).toBe("read_failed");
    expect(result.mutationsBlocked).toBe(true);
  });

  it("write failure leaves save state failed, never silently saved", async () => {
    const states: string[] = [];
    const queue = createWriteQueue((s) => states.push(s));
    vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("quota"));
    await expect(queue.enqueue(emptyWorkspace(), "user")).rejects.toBeTruthy();
    await new Promise((r) => setTimeout(r, 0));
    expect(queue.getSaveState()).toBe("failed");
    expect(states).toContain("failed");
    expect(states).not.toContain("saved");
  });

  it("rapid writes persist in order and keep last confirmed", async () => {
    const queue = createWriteQueue();
    const a = {
      ...emptyWorkspace(),
      projects: [createProjectRecord({ name: "A", clientName: "C" }, "p-a", new Date())],
    };
    const b = {
      ...emptyWorkspace(),
      projects: [createProjectRecord({ name: "B", clientName: "C" }, "p-b", new Date())],
    };
    void queue.enqueue(a, "user");
    await queue.enqueue(b, "user");
    const raw = store.get(EN_OBRA_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.data.projects[0].name).toBe("B");
    expect(queue.getLastConfirmed()?.projects[0].name).toBe("B");
  });

  it("material can be created with name only", () => {
    const material = createMaterialRecord({ name: "Cemento" }, "m1", "p1", "2026-07-18T10:00:00Z");
    expect(material.name).toBe("Cemento");
    expect(material.quantity).toBeUndefined();
    expect(material.supplierId).toBeUndefined();
    expect(material.expectedOn).toBeUndefined();
    expect(material.status).toBe("to_order");
  });

  it("expected delivery only applies when status becomes ordered", () => {
    const base = createMaterialRecord({ name: "PVC" }, "m1", "p1", "2026-07-18T10:00:00Z");
    const ordered = applyStatusChange(base, "ordered", {
      expectedOn: "2026-07-20",
      now: "2026-07-18T11:00:00Z",
    });
    expect(ordered.expectedOn).toBe("2026-07-20");
    const received = applyStatusChange(ordered, "received", {
      receivedOn: "2026-07-19",
      now: "2026-07-19T11:00:00Z",
    });
    expect(received.expectedOn).toBeUndefined();
    expect(received.proofNote).toMatch(/prestador/i);
  });

  it("latest receipt ignores updatedAt and editing old receipt does not win", () => {
    const materials: Material[] = [
      {
        id: "old",
        projectId: "p",
        name: "Old",
        status: "received",
        receivedOn: "2026-07-10",
        statusChangedAt: "2026-07-18T20:00:00Z",
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-18T20:00:00Z",
      },
      {
        id: "new",
        projectId: "p",
        name: "New",
        status: "received",
        receivedOn: "2026-07-15",
        statusChangedAt: "2026-07-15T00:00:00Z",
        createdAt: "2026-07-14T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z",
      },
    ];
    expect(latestReceiptDate(materials)).toBe("2026-07-15");
  });

  it("urgency uses injected today", () => {
    const material: Material = {
      id: "m",
      projectId: "p",
      name: "Grava",
      status: "ordered",
      expectedOn: "2026-07-17",
      statusChangedAt: "2026-07-16T00:00:00Z",
      createdAt: "2026-07-16T00:00:00Z",
      updatedAt: "2026-07-16T00:00:00Z",
    };
    expect(urgency(material, "2026-07-18")).toBe("late");
    expect(urgency(material, "2026-07-17")).toBe("today");
    expect(urgency({ ...material, expectedOn: "2026-07-19" }, "2026-07-18")).toBe("normal");
  });

  it("Mexico and international phone handling", () => {
    expect(normalizePhoneToE164("5512345678")).toBe("+525512345678");
    expect(normalizePhoneToE164("+525512345678")).toBe("+525512345678");
    expect(normalizePhoneToE164("+573001234567")).toBe("+573001234567");
    expect(normalizePhoneToE164("")).toBe("");
    expect(normalizePhoneToE164("123")).toBe("");
    expect(normalizePhoneToE164("not-a-phone")).toBe("");
    expect(formatPhoneDisplay("+525512345678")).toContain("52");
    expect(toWaMeDigits("+525512345678")).toBe("525512345678");
    expect(isValidPhoneForWhatsApp("+525512345678")).toBe(true);
  });

  it("supplier WhatsApp is job and material specific", () => {
    const text = buildSupplierMessage({
      jobName: "Jardín Camila",
      materialName: "Tierra negra",
      quantity: "12 costales",
      need: "Confirmar entrega",
      expectedOn: "2026-07-20",
    });
    expect(text).toContain("Jardín Camila");
    expect(text).toContain("Tierra negra");
    expect(text).not.toContain("Otro trabajo");
    expect(waMeUrl("+525512345678", text)).toMatch(/^https:\/\/wa\.me\/525512345678\?text=/);
  });

  it("client snapshot allowlists only safe fields", () => {
    const project = createProjectRecord({
      name: "Jardín",
      clientName: "Camila",
      clientPhone: "5512345678",
      address: "Roma",
      service: "Jardinería",
    }, "p1", new Date("2026-07-18T12:00:00Z"));
    const materials = [
      createMaterialRecord({ name: "Tierra", quantity: "2" }, "m1", "p1", "2026-07-18T12:00:00Z"),
      {
        ...createMaterialRecord({ name: "Grava" }, "m2", "p1", "2026-07-18T12:00:00Z"),
        supplierId: "secret-supplier",
        proofNote: "interno",
      },
    ];
    const snap = toClientSnapshot(project, materials);
    const json = JSON.stringify(snap);
    expect(json).not.toMatch(/price|payment|supplier|secret-supplier|interno|\+52/i);
    expect(snap.materials.every((m) => m.name)).toBe(true);
    const msg = buildClientMessage({
      jobName: project.name,
      clientFirstName: "Camila",
      materialsReadyCount: 0,
      materialsTotal: 2,
      items: snap.materials.map((m) => ({ name: m.name, quantity: m.quantity, status: m.status })),
    });
    expect(msg.toLowerCase()).toContain("material");
  });

  it("client update lists only ready materials and never mentions suppliers", () => {
    const demo = createDemoData(new Date("2026-11-04T16:30:00Z"));
    const project = demo.projects[0];
    const materials = demo.materials.filter((m) => m.projectId === project.id);
    const msg = clientUpdateMessage(project, materials);
    expect(msg.startsWith("Hola Camila,")).toBe(true);
    expect(msg).toContain(`1 de ${materials.length} materiales ya están listos en obra.`);
    expect(msg).toContain("- Tierra negra (12 costales)");
    expect(msg).not.toContain("Piedra de río");
    for (const supplier of demo.suppliers) {
      expect(msg).not.toContain(supplier.name);
    }
  });

  it("demo data uses non-routable phones", () => {
    const demo = createDemoData(new Date("2026-07-18T12:00:00Z"));
    for (const supplier of demo.suppliers) {
      if (supplier.phone) {
        expect(supplier.phone.startsWith("+52000") || supplier.phone === "").toBe(true);
      }
    }
  });
});
