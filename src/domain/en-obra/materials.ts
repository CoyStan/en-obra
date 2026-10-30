import { isIsoDate } from "./dates";
import type { Material, MaterialStatus } from "./types";

export type NewMaterialInput = {
  name: string;
  quantity?: string;
  supplierId?: string;
  expectedOn?: string;
};

export type MaterialDetailsUpdateInput = {
  name: string;
  quantity?: string;
  supplierId?: string;
  expectedOn?: string;
};

export function createMaterialRecord(
  input: NewMaterialInput,
  id: string,
  projectId: string,
  now: string,
): Material {
  const supplierId = input.supplierId?.trim() || undefined;
  return {
    id,
    projectId,
    supplierId,
    name: input.name.trim(),
    quantity: input.quantity?.trim() || undefined,
    status: "to_order",
    // expectedOn is only set when status becomes "ordered"
    statusChangedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateMaterialDetailsRecord(
  material: Material,
  input: MaterialDetailsUpdateInput,
  now: string,
): Material {
  const name = input.name.trim();
  if (!name) {
    return material;
  }
  const quantity = input.quantity?.trim() || undefined;
  const supplierId = input.supplierId?.trim() || undefined;
  const expectedOn = isIsoDate(input.expectedOn) ? input.expectedOn : undefined;
  const nextExpectedOn = material.status === "ordered" || material.status === "to_order"
    ? expectedOn
    : material.expectedOn;

  if (
    material.name === name
    && material.quantity === quantity
    && material.supplierId === supplierId
    && material.expectedOn === nextExpectedOn
  ) {
    return material;
  }

  return {
    ...material,
    name,
    quantity,
    supplierId,
    expectedOn: nextExpectedOn,
    updatedAt: now,
  };
}

export function materialBelongsToProject(material: Material, projectId: string) {
  return material.projectId === projectId;
}

export function materialsForProject(materials: Material[], projectId: string) {
  return materials.filter((material) => materialBelongsToProject(material, projectId));
}

export function isTerminalStatus(status: MaterialStatus) {
  return status === "installed";
}
