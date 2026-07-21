import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MaterialStatus,
  Project,
  Supplier,
  TrackerData,
} from "../../../src/tracker/types";
import { cloneDemoData, isoFromDate } from "./model";

const storageKey = "cuenta-obra-dashboard-v1";

type NewMaterial = {
  expectedOn?: string;
  name: string;
  price: string;
  quantity: string;
  supplierId: string;
};

type StatusUpdate = {
  expectedOn?: string;
  receivedOn?: string;
  status: MaterialStatus;
};

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseMoneyCents(value: string) {
  const normalized = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function loadData() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored) as TrackerData;
    }
  } catch {
    // The dashboard remains usable with its rich demo data.
  }
  return cloneDemoData();
}

export function useDashboardData() {
  const [data, setData] = useState<TrackerData>(loadData);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

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
  }, []);

  const updateMaterialStatus = useCallback((materialId: string, update: StatusUpdate) => {
    const now = new Date().toISOString();
    const today = isoFromDate(new Date());
    setData((current) => ({
      ...current,
      materials: current.materials.map((material) => {
        if (material.id !== materialId) {
          return material;
        }
        const received = update.status === "received" || update.status === "installed";
        const receivedOn = received ? update.receivedOn ?? material.receivedOn ?? today : undefined;
        return {
          ...material,
          expectedOn: update.status === "ordered" ? update.expectedOn : material.expectedOn,
          proofNote: received
            ? material.proofNote ?? (update.status === "installed" ? "Material usado en el trabajo." : "Recepción confirmada por el proveedor.")
            : undefined,
          receivedOn,
          status: update.status,
          updatedAt: now,
        };
      }),
    }));
  }, []);

  const addMaterial = useCallback((input: NewMaterial) => {
    if (!activeProject || !input.name.trim() || !input.quantity.trim() || !input.supplierId) {
      return false;
    }
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      materials: [{
        id: nextId("material"),
        projectId: activeProject.id,
        supplierId: input.supplierId,
        name: input.name.trim(),
        quantity: input.quantity.trim(),
        priceCents: parseMoneyCents(input.price),
        status: "to_order",
        paymentStatus: "pending",
        expectedOn: input.expectedOn,
        createdAt: now,
        updatedAt: now,
      }, ...current.materials],
    }));
    return true;
  }, [activeProject]);

  const addProject = useCallback((input: Pick<Project, "name" | "clientName" | "clientPhone" | "address">) => {
    if (!input.name.trim() || !input.clientName.trim()) {
      return false;
    }
    const id = nextId("project");
    const project: Project = {
      id,
      name: input.name.trim(),
      clientName: input.clientName.trim(),
      clientPhone: input.clientPhone.trim(),
      address: input.address.trim(),
      service: "Trabajo en curso",
      startedOn: isoFromDate(new Date()),
    };
    setData((current) => ({
      ...current,
      activeProjectId: id,
      projects: [project, ...current.projects],
    }));
    return true;
  }, []);

  const addSupplier = useCallback((input: Pick<Supplier, "name" | "category" | "phone">) => {
    if (!input.name.trim()) {
      return false;
    }
    const supplier: Supplier = {
      id: nextId("supplier"),
      name: input.name.trim(),
      category: input.category.trim() || "Materiales y trabajo",
      phone: input.phone.replace(/\D/g, ""),
      lastContactAt: new Date().toISOString(),
      lastContactNote: "Proveedor agregado al trabajo.",
    };
    setData((current) => ({ ...current, suppliers: [supplier, ...current.suppliers] }));
    return true;
  }, []);

  const resetDemo = useCallback(() => {
    setData(cloneDemoData());
  }, []);

  return {
    activeProject,
    addMaterial,
    addProject,
    addSupplier,
    allMaterials,
    data,
    materials,
    resetDemo,
    selectProject,
    updateMaterialStatus,
  };
}
