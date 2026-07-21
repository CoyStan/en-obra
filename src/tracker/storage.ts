import { isIsoDate } from "./dates";
import type { MaterialStatus, SupplierPaymentStatus, TrackerData, V1Material as Material, V1Project as Project, V1Supplier as Supplier } from "./v1types";

const materialStatuses = new Set<MaterialStatus>(["to_order", "ordered", "received", "installed"]);
const paymentStatuses = new Set<SupplierPaymentStatus>(["pending", "deposit_paid", "paid"]);

type NormalizedTrackerData = {
  data: TrackerData;
  repaired: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function projectFrom(value: unknown): Project | undefined {
  if (!isRecord(value)) return undefined;
  const id = text(value.id);
  const name = text(value.name);
  const clientName = text(value.clientName);
  const clientPhone = text(value.clientPhone);
  const address = text(value.address);
  const service = text(value.service);
  const startedOn = text(value.startedOn);
  if (!id || !name || !clientName || clientPhone === undefined || address === undefined || service === undefined || !startedOn || !isIsoDate(startedOn)) return undefined;
  return { id, name, clientName, clientPhone, address, service, startedOn };
}

function supplierFrom(value: unknown): Supplier | undefined {
  if (!isRecord(value)) return undefined;
  const id = text(value.id);
  const name = text(value.name);
  const category = text(value.category);
  const phone = text(value.phone);
  const lastContactAt = text(value.lastContactAt);
  const lastContactNote = text(value.lastContactNote);
  if (!id || !name || category === undefined || phone === undefined || !lastContactAt || lastContactNote === undefined) return undefined;
  return { id, name, category, phone, lastContactAt, lastContactNote };
}

function materialFrom(value: unknown, projectIds: Set<string>): Material | undefined {
  if (!isRecord(value)) return undefined;
  const id = text(value.id);
  const projectId = text(value.projectId);
  const supplierId = text(value.supplierId);
  const name = text(value.name);
  const quantity = text(value.quantity);
  const status = text(value.status);
  const paymentStatus = text(value.paymentStatus);
  const createdAt = text(value.createdAt);
  const updatedAt = text(value.updatedAt);
  const expectedOn = text(value.expectedOn);
  const receivedOn = text(value.receivedOn);
  const proofNote = text(value.proofNote);
  if (!id || !projectId || !supplierId || !name || !quantity || !createdAt || !updatedAt || !projectIds.has(projectId)) return undefined;
  if (!materialStatuses.has(status as MaterialStatus) || !paymentStatuses.has(paymentStatus as SupplierPaymentStatus)) return undefined;
  if (typeof value.priceCents !== "number" || !Number.isFinite(value.priceCents) || value.priceCents < 0) return undefined;
  return {
    id,
    projectId,
    supplierId,
    name,
    quantity,
    priceCents: Math.round(value.priceCents),
    status: status as MaterialStatus,
    paymentStatus: paymentStatus as SupplierPaymentStatus,
    expectedOn: isIsoDate(expectedOn) ? expectedOn : undefined,
    receivedOn: isIsoDate(receivedOn) ? receivedOn : undefined,
    proofNote,
    createdAt,
    updatedAt,
  };
}

export function normalizeTrackerData(value: unknown): NormalizedTrackerData | undefined {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.projects) || !Array.isArray(value.suppliers) || !Array.isArray(value.materials)) {
    return undefined;
  }
  const rawProjects = value.projects as unknown[];
  const rawSuppliers = value.suppliers as unknown[];
  const rawMaterials = value.materials as unknown[];
  const projects = rawProjects.map(projectFrom).filter((project): project is Project => Boolean(project));
  if (!projects.length) return undefined;
  const suppliers = rawSuppliers.map(supplierFrom).filter((supplier): supplier is Supplier => Boolean(supplier));
  const projectIds = new Set(projects.map((project) => project.id));
  const materials = rawMaterials.map((material) => materialFrom(material, projectIds)).filter((material): material is Material => Boolean(material));
  const activeProjectId = typeof value.activeProjectId === "string" && projectIds.has(value.activeProjectId)
    ? value.activeProjectId
    : projects[0].id;
  const demoRevision = typeof value.demoRevision === "number" ? value.demoRevision : undefined;
  const data: TrackerData = { version: 1, demoRevision, activeProjectId, projects, suppliers, materials };
  const repaired = activeProjectId !== value.activeProjectId
    || projects.length !== rawProjects.length
    || suppliers.length !== rawSuppliers.length
    || materials.length !== rawMaterials.length
    || data.materials.some((material, index) => material.expectedOn !== (rawMaterials[index] as Record<string, unknown> | undefined)?.expectedOn || material.receivedOn !== (rawMaterials[index] as Record<string, unknown> | undefined)?.receivedOn);
  return { data, repaired };
}
