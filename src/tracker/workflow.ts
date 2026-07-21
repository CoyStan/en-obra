import { isIsoDate, todayIsoDate } from "./dates";
import type { Material, MaterialStatusUpdateInput, NewProjectInput, NewSupplierInput, Project, Supplier } from "./types";

export function parsePriceCents(value: string) {
  const compact = value.replace(/[^0-9.,]/g, "");
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);
  const hasBothSeparators = lastComma >= 0 && lastDot >= 0;
  const hasDecimal = decimalIndex >= 0 && (hasBothSeparators || compact.length - decimalIndex - 1 !== 3);
  const normalized = hasDecimal
    ? `${compact.slice(0, decimalIndex).replace(/[.,]/g, "")}.${compact.slice(decimalIndex + 1).replace(/[.,]/g, "")}`
    : compact.replace(/[.,]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function updateMaterialStatusRecord(material: Material, input: MaterialStatusUpdateInput, now: string): Material {
  const today = todayIsoDate(new Date(now));
  const hasReceivedState = input.status === "received" || input.status === "installed";
  const requestedReceivedOn = input.receivedOn ?? material.receivedOn ?? today;
  const receivedOn = hasReceivedState && isIsoDate(requestedReceivedOn) && requestedReceivedOn <= today
    ? requestedReceivedOn
    : hasReceivedState ? today : undefined;
  const receiptChanged = receivedOn !== material.receivedOn;
  const proofNote = !hasReceivedState
    ? undefined
    : input.status === "received"
      ? receiptChanged ? "Recepción confirmada por el proveedor." : material.proofNote ?? "Recepción confirmada por el proveedor."
      : receiptChanged ? "Material usado en el trabajo." : material.proofNote ?? "Material usado en el trabajo.";
  const expectedOn = input.status === "ordered"
    ? isIsoDate(input.expectedOn) ? input.expectedOn : undefined
    : material.expectedOn;
  if (material.status === input.status && material.expectedOn === expectedOn && material.receivedOn === receivedOn && material.proofNote === proofNote) {
    return material;
  }
  return {
    ...material,
    status: input.status,
    expectedOn,
    receivedOn,
    proofNote,
    updatedAt: now,
  };
}

export function createProjectRecord(input: NewProjectInput, id: string, today: string): Project {
  return {
    id,
    name: input.name.trim(),
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone?.replace(/\D/g, "") ?? "",
    address: input.address?.trim() ?? "",
    service: "Trabajo en curso",
    startedOn: today,
  };
}

export function createSupplierRecord(input: NewSupplierInput, id: string, now: string): Supplier {
  return {
    id,
    name: input.name.trim(),
    category: input.category?.trim() || "Materiales y trabajo",
    phone: input.phone?.replace(/\D/g, "") ?? "",
    lastContactAt: now,
    lastContactNote: input.lastContactNote?.trim() || "Sin nota todavía. Escribe el último acuerdo cuando puedas.",
  };
}

export function updateMaterialDetailsRecord(
  material: Material,
  input: { name: string; quantity: string; supplierId: string; expectedOn?: string },
  now: string,
): Material {
  const name = input.name.trim();
  const quantity = input.quantity.trim();
  const supplierId = input.supplierId.trim();
  const expectedOn = isIsoDate(input.expectedOn) ? input.expectedOn : undefined;
  if (!name || !quantity || !supplierId) {
    return material;
  }
  if (
    material.name === name
    && material.quantity === quantity
    && material.supplierId === supplierId
    && material.expectedOn === expectedOn
  ) {
    return material;
  }
  return {
    ...material,
    name,
    quantity,
    supplierId,
    expectedOn: material.status === "ordered" || material.status === "to_order" ? expectedOn : material.expectedOn,
    updatedAt: now,
  };
}

export function updateProjectRecord(
  project: Project,
  input: { name: string; clientName: string; clientPhone?: string; address?: string },
): Project {
  const name = input.name.trim();
  const clientName = input.clientName.trim();
  if (!name || !clientName) {
    return project;
  }
  return {
    ...project,
    name,
    clientName,
    clientPhone: input.clientPhone?.replace(/\D/g, "") ?? "",
    address: input.address?.trim() ?? "",
  };
}

export function updateSupplierRecord(
  supplier: Supplier,
  input: { name: string; phone?: string; category?: string; lastContactNote?: string },
  now: string,
): Supplier {
  const name = input.name.trim();
  if (!name) {
    return supplier;
  }
  return {
    ...supplier,
    name,
    phone: input.phone?.replace(/\D/g, "") ?? "",
    category: input.category?.trim() || "Materiales y trabajo",
    lastContactNote: input.lastContactNote?.trim() || supplier.lastContactNote,
    lastContactAt: now,
  };
}
