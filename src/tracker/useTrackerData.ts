import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createId } from "../utils/id";
import { todayIsoDate } from "./dates";
import { cloneTrackerDemoData } from "./demoData";
import { normalizeTrackerData } from "./storage";
import type {
  MaterialDetailsUpdateInput,
  MaterialStatusUpdateInput,
  NewMaterialInput,
  NewProjectInput,
  NewSupplierInput,
  ProjectUpdateInput,
  SupplierUpdateInput,
  TrackerData,
} from "./types";
import {
  createProjectRecord,
  createSupplierRecord,
  parsePriceCents,
  updateMaterialDetailsRecord,
  updateMaterialStatusRecord,
  updateProjectRecord,
  updateSupplierRecord,
} from "./workflow";

const storageKey = "cuenta-obra-tracker-v1";
const currentDemoRevision = 2;
const legacyDemoProjectIds = new Set(["project-camila", "project-jorge"]);

function isLegacyDemoData(data: TrackerData) {
  return data.demoRevision !== currentDemoRevision
    && data.projects.length > 0
    && data.projects.every((project) => legacyDemoProjectIds.has(project.id));
}

export function useTrackerData() {
  const [data, setData] = useState<TrackerData>(() => cloneTrackerDemoData());
  const [isLoading, setIsLoading] = useState(true);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());

  const persist = useCallback((next: TrackerData) => {
    const write = writes.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next)));
    writes.current = write;
    void write
      .then(() => setPersistenceError(null))
      .catch(() => setPersistenceError("No se pudo guardar este cambio. Revisa tu conexión y vuelve a abrir la app."));
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (!active || !stored) {
          return;
        }
        const restored = normalizeTrackerData(JSON.parse(stored));
        if (!restored) {
          const nextDemo = cloneTrackerDemoData();
          setData(nextDemo);
          persist(nextDemo);
          setPersistenceError("Los datos guardados no se pudieron leer. Cargamos una versión segura del demo.");
          return;
        }
        const parsed = restored.data;
        if (isLegacyDemoData(parsed)) {
            const nextDemo = cloneTrackerDemoData();
            setData(nextDemo);
            persist(nextDemo);
            return;
        }
        setData(parsed);
        if (restored.repaired) {
          persist(parsed);
          setPersistenceError("Corregimos datos incompletos guardados en este dispositivo.");
        }
      })
      .catch(() => {
        if (active) {
          setPersistenceError("No se pudieron leer los datos guardados. Puedes continuar con el demo.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [persist]);

  const save = useCallback((updater: (current: TrackerData) => TrackerData) => {
    setData((current) => {
      const next = updater(current);
      if (next !== current) {
        persist(next);
      }
      return next;
    });
  }, [persist]);

  const activeProject = useMemo(
    () => data.projects.find((project) => project.id === data.activeProjectId) ?? data.projects[0],
    [data],
  );
  const materials = useMemo(
    () => data.materials.filter((material) => material.projectId === activeProject?.id),
    [data.materials, activeProject?.id],
  );

  const addMaterial = useCallback((input: NewMaterialInput) => {
    if (!activeProject || !input.name.trim() || !input.quantity.trim() || !input.supplierId) {
      return false;
    }
    const now = new Date().toISOString();
    save((current) => ({
      ...current,
      materials: [
        {
          id: createId("material"),
          projectId: activeProject.id,
          supplierId: input.supplierId,
          name: input.name.trim(),
          quantity: input.quantity.trim(),
          priceCents: parsePriceCents(input.price),
          status: "to_order",
          paymentStatus: "pending",
          expectedOn: input.expectedOn?.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        },
        ...current.materials,
      ],
    }));
    return true;
  }, [activeProject, save]);

  const addProject = useCallback((input: NewProjectInput) => {
    if (!input.name.trim() || !input.clientName.trim()) {
      return false;
    }
    const id = createId("project");
    const today = todayIsoDate();
    save((current) => ({
      ...current,
      activeProjectId: id,
      projects: [createProjectRecord(input, id, today), ...current.projects],
    }));
    return true;
  }, [save]);

  const selectProject = useCallback((projectId: string) => {
    save((current) => current.projects.some((project) => project.id === projectId)
      ? { ...current, activeProjectId: projectId }
      : current);
  }, [save]);

  const addSupplier = useCallback((input: NewSupplierInput) => {
    if (!input.name.trim()) {
      return undefined;
    }
    const id = createId("supplier");
    const now = new Date().toISOString();
    save((current) => ({
      ...current,
      suppliers: [createSupplierRecord(input, id, now), ...current.suppliers],
    }));
    return id;
  }, [save]);

  const updateMaterialStatus = useCallback((materialId: string, input: MaterialStatusUpdateInput) => {
    const now = new Date().toISOString();
    save((current) => ({
      ...current,
      materials: current.materials.map((material) => {
        if (material.id !== materialId) {
          return material;
        }
        return updateMaterialStatusRecord(material, input, now);
      }),
    }));
  }, [save]);

  const updateMaterialDetails = useCallback((materialId: string, input: MaterialDetailsUpdateInput) => {
    if (!input.name.trim() || !input.quantity.trim() || !input.supplierId) {
      return false;
    }
    const now = new Date().toISOString();
    save((current) => ({
      ...current,
      materials: current.materials.map((material) => {
        if (material.id !== materialId) {
          return material;
        }
        return updateMaterialDetailsRecord(material, input, now);
      }),
    }));
    return true;
  }, [save]);

  const updateProject = useCallback((projectId: string, input: ProjectUpdateInput) => {
    if (!input.name.trim() || !input.clientName.trim()) {
      return false;
    }
    save((current) => ({
      ...current,
      projects: current.projects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        return updateProjectRecord(project, input);
      }),
    }));
    return true;
  }, [save]);

  const updateSupplier = useCallback((supplierId: string, input: SupplierUpdateInput) => {
    if (!input.name.trim()) {
      return false;
    }
    const now = new Date().toISOString();
    save((current) => ({
      ...current,
      suppliers: current.suppliers.map((supplier) => {
        if (supplier.id !== supplierId) {
          return supplier;
        }
        return updateSupplierRecord(supplier, input, now);
      }),
    }));
    return true;
  }, [save]);

  const resetDemo = useCallback(() => {
    const next = cloneTrackerDemoData();
    setData(next);
    persist(next);
  }, [persist]);

  return {
    activeProject,
    addMaterial,
    addProject,
    addSupplier,
    updateMaterialDetails,
    updateMaterialStatus,
    updateProject,
    updateSupplier,
    data,
    isLoading,
    materials,
    persistenceError,
    resetDemo,
    selectProject,
  };
}
