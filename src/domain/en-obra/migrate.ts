import { isIsoDate } from "./dates";
import { normalizePhoneToE164 } from "./phone";
import type { Material, MaterialStatus, Project, Supplier, TrackerDataV2 } from "./types";

type TrackerDataV1 = {
  version: 1;
  demoRevision?: number;
  activeProjectId?: string;
  projects: Array<{
    id: string;
    name: string;
    clientName: string;
    clientPhone: string;
    address: string;
    service: string;
    startedOn: string;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    category: string;
    phone: string;
    lastContactAt?: string;
    lastContactNote?: string;
  }>;
  materials: Array<{
    id: string;
    projectId: string;
    supplierId?: string;
    name: string;
    quantity?: string;
    status: MaterialStatus;
    expectedOn?: string;
    receivedOn?: string;
    proofNote?: string;
    createdAt: string;
    updatedAt: string;
    priceCents?: number;
    paymentStatus?: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asV1(raw: unknown): TrackerDataV1 | undefined {
  if (!isRecord(raw) || raw.version !== 1) {
    return undefined;
  }
  if (!Array.isArray(raw.projects) || !Array.isArray(raw.suppliers) || !Array.isArray(raw.materials)) {
    return undefined;
  }
  return raw as unknown as TrackerDataV1;
}

export function migrateV1ToV2(raw: unknown): TrackerDataV2 {
  const source = asV1(raw);
  if (!source) {
    throw new Error("Expected tracker data version 1.");
  }

  const projects: Project[] = source.projects.map((project) => ({
    id: project.id,
    name: project.name,
    clientName: project.clientName,
    clientPhone: normalizePhoneToE164(project.clientPhone),
    address: project.address,
    service: project.service,
    startedOn: project.startedOn,
    lifecycle: "active",
  }));

  const projectIds = new Set(projects.map((project) => project.id));
  const activeProjectId = typeof source.activeProjectId === "string" && projectIds.has(source.activeProjectId)
    ? source.activeProjectId
    : projects[0]?.id;

  const suppliers: Supplier[] = source.suppliers.map((supplier) => {
    const timestamp = supplier.lastContactAt ?? new Date(0).toISOString();
    return {
      id: supplier.id,
      name: supplier.name,
      category: supplier.category,
      phone: normalizePhoneToE164(supplier.phone),
      createdAt: timestamp,
      updatedAt: timestamp,
      lastContactAt: supplier.lastContactAt,
      lastContactNote: supplier.lastContactNote,
    };
  });

  const materials: Material[] = source.materials
    .filter((material) => projectIds.has(material.projectId))
    .map((material) => {
      const supplierId = material.supplierId?.trim() ? material.supplierId : undefined;
      const expectedOn = material.status === "ordered" && isIsoDate(material.expectedOn)
        ? material.expectedOn
        : material.status === "received" && isIsoDate(material.expectedOn)
          ? material.expectedOn
          : undefined;
      const installedOn = material.status === "installed" && isIsoDate(material.receivedOn)
        ? material.receivedOn
        : undefined;

      return {
        id: material.id,
        projectId: material.projectId,
        supplierId,
        name: material.name,
        quantity: material.quantity,
        status: material.status,
        expectedOn,
        receivedOn: isIsoDate(material.receivedOn) ? material.receivedOn : undefined,
        installedOn,
        statusChangedAt: material.updatedAt,
        proofNote: material.proofNote,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
      };
    });

  return {
    schemaVersion: 2,
    activeProjectId,
    projects,
    suppliers,
    materials,
  };
}

export type { TrackerDataV1 };
