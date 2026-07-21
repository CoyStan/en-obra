import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyStatusChange,
} from "../domain/en-obra/status";
import {
  createMaterialRecord,
  materialsForProject,
  updateMaterialDetailsRecord,
  type MaterialDetailsUpdateInput,
  type NewMaterialInput,
} from "../domain/en-obra/materials";
import {
  createProjectRecord,
  setProjectLifecycle,
  updateProjectRecord,
  type NewProjectInput,
  type ProjectUpdateInput,
} from "../domain/en-obra/projects";
import type {
  DatasetKind,
  Material,
  MaterialStatus,
  Project,
  ProjectLifecycle,
  Supplier,
  TrackerDataV2,
} from "../domain/en-obra/types";
import { normalizePhoneToE164 } from "../domain/en-obra/phone";
import {
  createWriteQueue,
  emptyWorkspace,
  eraseAllUserData,
  exportEnvelopeJson,
  loadDemoWorkspace,
  loadUserWorkspace,
  readRecoveryPayload,
  type LoadResult,
  type SaveState,
} from "../persistence/enObraRepository";
import { createId } from "../utils/id";

export type WorkspaceMode = "boot" | "chooser" | "user" | "demo" | "recovery";

export type NewSupplierInput = {
  name: string;
  phone?: string;
  category?: string;
};

export type SupplierUpdateInput = {
  name: string;
  phone?: string;
  category?: string;
};

export type RegisterContactInput = {
  note: string;
};

function createSupplierRecord(input: NewSupplierInput, id: string, now: string): Supplier {
  return {
    id,
    name: input.name.trim(),
    category: input.category?.trim() ?? "",
    phone: normalizePhoneToE164(input.phone ?? ""),
    createdAt: now,
    updatedAt: now,
  };
}

export function useEnObraStore() {
  const [mode, setMode] = useState<WorkspaceMode>("boot");
  const [data, setData] = useState<TrackerDataV2>(() => emptyWorkspace());
  const [datasetKind, setDatasetKind] = useState<DatasetKind>("user");
  const [isLoading, setIsLoading] = useState(true);
  const [mutationsBlocked, setMutationsBlocked] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryRaw, setRecoveryRaw] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const dataRef = useRef(data);
  const datasetKindRef = useRef(datasetKind);
  const mutationsBlockedRef = useRef(mutationsBlocked);
  const queueRef = useRef(createWriteQueue(setSaveState));

  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    datasetKindRef.current = datasetKind;
  }, [datasetKind]);
  useEffect(() => {
    mutationsBlockedRef.current = mutationsBlocked;
  }, [mutationsBlocked]);

  const applyLoad = useCallback((result: LoadResult, nextMode: WorkspaceMode) => {
    setData(result.data);
    setDatasetKind(result.datasetKind);
    setMutationsBlocked(result.mutationsBlocked);
    if (result.status === "corrupt" || result.status === "read_failed") {
      setRecoveryError(result.reason);
      setRecoveryRaw(result.recoveryRaw);
      setMode("recovery");
    } else if (result.status === "empty") {
      setRecoveryError(null);
      setRecoveryRaw(null);
      setMode("chooser");
    } else {
      setRecoveryError(null);
      setRecoveryRaw(null);
      setMode(nextMode);
      if ("migrated" in result && result.migrated) {
        setInfoNotice("Migrarmos tus datos a la versión actual de En Obra.");
      }
    }
  }, []);

  const boot = useCallback(async () => {
    setIsLoading(true);
    const result = await loadUserWorkspace();
    applyLoad(result, "user");
    setIsLoading(false);
  }, [applyLoad]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const persistOutsideUpdater = useCallback((next: TrackerDataV2) => {
    if (mutationsBlockedRef.current) {
      return;
    }
    void queueRef.current.enqueue(next, datasetKindRef.current);
  }, []);

  const commit = useCallback((updater: (current: TrackerDataV2) => TrackerDataV2) => {
    if (mutationsBlockedRef.current) {
      return false;
    }
    const current = dataRef.current;
    const next = updater(current);
    if (next === current) {
      return false;
    }
    setData(next);
    persistOutsideUpdater(next);
    return true;
  }, [persistOutsideUpdater]);

  const retryLoad = useCallback(async () => {
    await boot();
  }, [boot]);

  const startEmptyWorkspace = useCallback(() => {
    const empty = emptyWorkspace();
    setData(empty);
    setDatasetKind("user");
    setMutationsBlocked(false);
    setRecoveryError(null);
    setMode("user");
    persistOutsideUpdater(empty);
  }, [persistOutsideUpdater]);

  const startDemoWorkspace = useCallback(async () => {
    const result = await loadDemoWorkspace(new Date());
    applyLoad(result, "demo");
  }, [applyLoad]);

  const leaveDemo = useCallback(async () => {
    await boot();
  }, [boot]);

  const activeProject = useMemo(
    () => data.projects.find((project) => project.id === data.activeProjectId)
      ?? data.projects.find((project) => project.lifecycle === "active")
      ?? data.projects[0],
    [data],
  );

  const activeProjects = useMemo(
    () => data.projects.filter((project) => project.lifecycle === "active"),
    [data.projects],
  );

  const materials = useMemo(
    () => (activeProject ? materialsForProject(data.materials, activeProject.id) : []),
    [data.materials, activeProject],
  );

  const hoyMaterials = useMemo(() => {
    const activeIds = new Set(activeProjects.map((project) => project.id));
    return data.materials.filter((material) => activeIds.has(material.projectId));
  }, [data.materials, activeProjects]);

  const addProject = useCallback((input: NewProjectInput) => {
    if (!input.name.trim() || !input.clientName.trim()) {
      return false;
    }
    const id = createId("project");
    return commit((current) => ({
      ...current,
      activeProjectId: id,
      projects: [createProjectRecord(input, id, new Date()), ...current.projects],
    }));
  }, [commit]);

  const updateProject = useCallback((projectId: string, input: ProjectUpdateInput) => {
    return commit((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? updateProjectRecord(project, input) : project),
    }));
  }, [commit]);

  const setActiveProject = useCallback((projectId: string) => {
    return commit((current) => {
      if (!current.projects.some((project) => project.id === projectId)) {
        return current;
      }
      return { ...current, activeProjectId: projectId };
    });
  }, [commit]);

  const setLifecycle = useCallback((projectId: string, lifecycle: ProjectLifecycle) => {
    const now = new Date().toISOString();
    return commit((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? setProjectLifecycle(project, lifecycle, now) : project),
    }));
  }, [commit]);

  const addMaterial = useCallback((input: NewMaterialInput, projectId?: string) => {
    const targetId = projectId ?? activeProject?.id;
    if (!targetId || !input.name.trim()) {
      return false;
    }
    const now = new Date().toISOString();
    const id = createId("material");
    return commit((current) => ({
      ...current,
      materials: [createMaterialRecord(input, id, targetId, now), ...current.materials],
    }));
  }, [activeProject?.id, commit]);

  const updateMaterialDetails = useCallback((materialId: string, input: MaterialDetailsUpdateInput) => {
    const now = new Date().toISOString();
    return commit((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === materialId ? updateMaterialDetailsRecord(material, input, now) : material),
    }));
  }, [commit]);

  const changeMaterialStatus = useCallback((
    materialId: string,
    status: MaterialStatus,
    options?: { expectedOn?: string; receivedOn?: string },
  ) => {
    const now = new Date().toISOString();
    return commit((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === materialId
          ? applyStatusChange(material, status, { ...options, now })
          : material),
    }));
  }, [commit]);

  const deleteMaterial = useCallback((materialId: string): Material | undefined => {
    let removed: Material | undefined;
    commit((current) => {
      removed = current.materials.find((material) => material.id === materialId);
      if (!removed) {
        return current;
      }
      return {
        ...current,
        materials: current.materials.filter((material) => material.id !== materialId),
      };
    });
    return removed;
  }, [commit]);

  const restoreMaterial = useCallback((material: Material) => {
    return commit((current) => {
      if (current.materials.some((item) => item.id === material.id)) {
        return current;
      }
      return { ...current, materials: [material, ...current.materials] };
    });
  }, [commit]);

  const addSupplier = useCallback((input: NewSupplierInput) => {
    if (!input.name.trim()) {
      return undefined;
    }
    const id = createId("supplier");
    const now = new Date().toISOString();
    const ok = commit((current) => ({
      ...current,
      suppliers: [createSupplierRecord(input, id, now), ...current.suppliers],
    }));
    return ok ? id : undefined;
  }, [commit]);

  const updateSupplier = useCallback((supplierId: string, input: SupplierUpdateInput) => {
    if (!input.name.trim()) {
      return false;
    }
    const now = new Date().toISOString();
    return commit((current) => ({
      ...current,
      suppliers: current.suppliers.map((supplier) => {
        if (supplier.id !== supplierId) {
          return supplier;
        }
        return {
          ...supplier,
          name: input.name.trim(),
          phone: normalizePhoneToE164(input.phone ?? ""),
          category: input.category?.trim() ?? "",
          updatedAt: now,
          // lastContactAt only via registerContact
        };
      }),
    }));
  }, [commit]);

  const registerSupplierContact = useCallback((supplierId: string, input: RegisterContactInput) => {
    const now = new Date().toISOString();
    return commit((current) => ({
      ...current,
      suppliers: current.suppliers.map((supplier) =>
        supplier.id === supplierId
          ? {
            ...supplier,
            lastContactAt: now,
            lastContactNote: input.note.trim(),
            updatedAt: now,
          }
          : supplier),
    }));
  }, [commit]);

  const deleteSupplier = useCallback((supplierId: string): { ok: true } | { ok: false; reason: string; count: number } => {
    const refs = dataRef.current.materials.filter((material) => material.supplierId === supplierId);
    if (refs.length) {
      return {
        ok: false,
        reason: "Este proveedor está ligado a materiales. Quítalo de esos materiales o archívalo.",
        count: refs.length,
      };
    }
    const ok = commit((current) => ({
      ...current,
      suppliers: current.suppliers.filter((supplier) => supplier.id !== supplierId),
    }));
    return ok ? { ok: true } : { ok: false, reason: "No se pudo borrar.", count: 0 };
  }, [commit]);

  const eraseAll = useCallback(async () => {
    if (datasetKindRef.current !== "user") {
      return false;
    }
    await eraseAllUserData();
    const empty = emptyWorkspace();
    setData(empty);
    setMode("chooser");
    setSaveState("saved");
    return true;
  }, []);

  const exportJson = useCallback(async () => {
    return exportEnvelopeJson(dataRef.current, datasetKindRef.current);
  }, []);

  const getRecoveryExport = useCallback(async () => {
    return recoveryRaw ?? (await readRecoveryPayload());
  }, [recoveryRaw]);

  return {
    mode,
    data,
    datasetKind,
    isDemo: datasetKind === "demo",
    isLoading,
    mutationsBlocked,
    recoveryError,
    recoveryRaw,
    saveState,
    infoNotice,
    clearInfoNotice: () => setInfoNotice(null),
    activeProject,
    activeProjects,
    materials,
    hoyMaterials,
    suppliers: data.suppliers,
    projects: data.projects,
    retryLoad,
    startEmptyWorkspace,
    startDemoWorkspace,
    leaveDemo,
    addProject,
    updateProject,
    setActiveProject,
    setLifecycle,
    addMaterial,
    updateMaterialDetails,
    changeMaterialStatus,
    deleteMaterial,
    restoreMaterial,
    addSupplier,
    updateSupplier,
    registerSupplierContact,
    deleteSupplier,
    eraseAll,
    exportJson,
    getRecoveryExport,
  };
}

export type EnObraStore = ReturnType<typeof useEnObraStore>;
export type { Material, Project, Supplier, MaterialStatus, NewMaterialInput, MaterialDetailsUpdateInput, NewProjectInput, ProjectUpdateInput };
