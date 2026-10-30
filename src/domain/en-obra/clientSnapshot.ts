import type { Material, MaterialStatus, Project } from "./types";

export type ClientSnapshotMaterial = {
  name: string;
  quantity?: string;
  status: MaterialStatus;
  receivedOn?: string;
  installedOn?: string;
  statusChangedAt: string;
};

export type ClientSnapshot = {
  name: string;
  service: string;
  address: string;
  clientName: string;
  materials: ClientSnapshotMaterial[];
};

export function toClientSnapshot(project: Project, materials: Material[]): ClientSnapshot {
  return {
    name: project.name,
    service: project.service,
    address: project.address,
    clientName: project.clientName,
    materials: materials.map((material) => ({
      name: material.name,
      quantity: material.quantity,
      status: material.status,
      receivedOn: material.receivedOn,
      installedOn: material.installedOn,
      statusChangedAt: material.statusChangedAt,
    })),
  };
}
