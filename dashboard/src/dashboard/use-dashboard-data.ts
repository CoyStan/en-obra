import { useCallback, useEffect, useMemo, useReducer } from "react";
import type {
  MaterialStatus,
  Project,
  StorageEnvelope,
  Supplier,
  TrackerDataV2,
} from "../../../src/domain/en-obra";
import {
  applyStatusChange,
  createDemoData,
  createMaterialRecord,
  createProjectRecord,
  loadFromUnknown,
  migrateV1ToV2,
} from "../../../src/domain/en-obra";
import { isoFromDate } from "./model";

const STORAGE_KEY = "cuenta-obra-dashboard-v2";
const CORRUPT_BACKUP_KEY = "cuenta-obra-dashboard-corrupt-backup";

export type StorageStatus = "ok" | "corrupt" | "v1migrated";

type State = {
  data: TrackerDataV2;
  storageStatus: StorageStatus;
  corruptReason?: string;
};

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildEnvelope(data: TrackerDataV2): StorageEnvelope {
  return {
    datasetKind: "demo",
    schemaVersion: 2,
    data,
    writtenAt: new Date().toISOString(),
  };
}

function tryLoad(): { state: State; rawForBackup?: string } {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { state: { data: createDemoData(new Date()), storageStatus: "ok" } };
  }

  if (!raw) {
    return { state: { data: createDemoData(new Date()), storageStatus: "ok" } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      state: { data: createDemoData(new Date()), storageStatus: "corrupt", corruptReason: "El almacenamiento no es JSON válido." },
      rawForBackup: raw,
    };
  }

  const result = loadFromUnknown(parsed);

  if (result.kind === "v2") {
    return { state: { data: result.envelope.data, storageStatus: "ok" } };
  }

  if (result.kind === "v1") {
    try {
      const migrated = migrateV1ToV2(result.data);
      return { state: { data: migrated, storageStatus: "v1migrated" } };
    } catch {
      return {
        state: { data: createDemoData(new Date()), storageStatus: "corrupt", corruptReason: "Fallo al migrar datos anteriores." },
        rawForBackup: raw,
      };
    }
  }

  return {
    state: { data: createDemoData(new Date()), storageStatus: "corrupt", corruptReason: result.reason },
    rawForBackup: raw,
  };
}

type Action =
  | { type: "SET_DATA"; data: TrackerDataV2 }
  | { type: "RECOVER"; data: TrackerDataV2 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_DATA":
      return { ...state, data: action.data, storageStatus: state.storageStatus === "corrupt" ? "ok" : state.storageStatus };
    case "RECOVER":
      return { data: action.data, storageStatus: "ok", corruptReason: undefined };
    default:
      return state;
  }
}

export function loadDashboardState(): State {
  const { state, rawForBackup } = tryLoad();
  if (rawForBackup) {
    try {
      window.localStorage.setItem(CORRUPT_BACKUP_KEY, rawForBackup);
    } catch {
      // ignore
    }
  }
  return state;
}

export function useDashboardData() {
  const [state, dispatch] = useReducer(reducer, undefined, loadDashboardState);
  const { data, storageStatus, corruptReason } = state;

  useEffect(() => {
    if (storageStatus === "corrupt") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildEnvelope(data)));
    } catch {
      // ignore (private mode or quota)
    }
  }, [data, storageStatus]);

  const setData = useCallback((updater: (current: TrackerDataV2) => TrackerDataV2) => {
    dispatch({ type: "SET_DATA", data: updater(state.data) });
  }, [state.data]);

  const activeProject = useMemo(
    () => data.projects.find((project) => project.id === data.activeProjectId) ?? data.projects[0],
    [data],
  );
  const materials = useMemo(
    () => data.materials.filter((material) => material.projectId === activeProject?.id),
    [activeProject?.id, data.materials],
  );
  const allMaterials = data.materials;

  const selectProject = useCallback((projectId: string) => {
    setData((current) => ({ ...current, activeProjectId: projectId }));
  }, [setData]);

  const updateMaterialStatus = useCallback((materialId: string, update: { status: MaterialStatus; expectedOn?: string; receivedOn?: string }) => {
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      materials: current.materials.map((material) => {
        if (material.id !== materialId) return material;
        return applyStatusChange(material, update.status, {
          expectedOn: update.expectedOn,
          receivedOn: update.receivedOn,
          now,
        });
      }),
    }));
  }, [setData]);

  const addMaterial = useCallback((input: { name: string; quantity?: string; supplierId?: string; expectedOn?: string; projectId?: string }) => {
    const targetProjectId = input.projectId ?? activeProject?.id;
    if (!targetProjectId || !input.name.trim()) {
      return false;
    }
    const now = new Date().toISOString();
    const material = createMaterialRecord(
      { name: input.name.trim(), quantity: input.quantity?.trim() || undefined, supplierId: input.supplierId || undefined, expectedOn: input.expectedOn },
      nextId("material"),
      targetProjectId,
      now,
    );
    setData((current) => ({
      ...current,
      materials: [material, ...current.materials],
    }));
    return true;
  }, [activeProject?.id, setData]);

  const addProject = useCallback((input: Pick<Project, "name" | "clientName" | "clientPhone" | "address">) => {
    if (!input.name.trim() || !input.clientName.trim()) {
      return false;
    }
    const id = nextId("project");
    const project = createProjectRecord(
      { name: input.name, clientName: input.clientName, clientPhone: input.clientPhone, address: input.address },
      id,
      new Date(),
    );
    setData((current) => ({
      ...current,
      activeProjectId: id,
      projects: [project, ...current.projects],
    }));
    return true;
  }, [setData]);

  const addSupplier = useCallback((input: Pick<Supplier, "name" | "category" | "phone">) => {
    if (!input.name.trim()) {
      return false;
    }
    const now = new Date().toISOString();
    const supplier: Supplier = {
      id: nextId("supplier"),
      name: input.name.trim(),
      category: input.category.trim() || "Materiales y trabajo",
      phone: input.phone.replace(/\D/g, ""),
      createdAt: now,
      updatedAt: now,
      lastContactAt: now,
      lastContactNote: "Proveedor agregado al trabajo.",
    };
    setData((current) => ({ ...current, suppliers: [supplier, ...current.suppliers] }));
    return true;
  }, [setData]);

  const resetDemo = useCallback(() => {
    if (!import.meta.env.DEV) return;
    const fresh = createDemoData(new Date());
    dispatch({ type: "RECOVER", data: fresh });
  }, []);

  const exportCorruptBackup = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(CORRUPT_BACKUP_KEY) ?? "{}";
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `en-obra-backup-${isoFromDate(new Date())}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, []);

  const retryLoad = useCallback(() => {
    const { state: fresh, rawForBackup } = tryLoad();
    if (rawForBackup) {
      try {
        window.localStorage.setItem(CORRUPT_BACKUP_KEY, rawForBackup);
      } catch {
        // ignore
      }
    }
    dispatch({ type: "RECOVER", data: fresh.data });
  }, []);

  return {
    activeProject,
    addMaterial,
    addProject,
    addSupplier,
    allMaterials,
    corruptReason,
    data,
    exportCorruptBackup,
    materials,
    resetDemo,
    retryLoad,
    selectProject,
    storageStatus,
    updateMaterialStatus,
  };
}
