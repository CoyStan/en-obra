export type MaterialStatus = "to_order" | "ordered" | "received" | "installed";
export type ProjectLifecycle = "active" | "completed" | "archived";
export type DatasetKind = "user" | "demo";

export type Project = {
  id: string;
  name: string;
  clientName: string;
  clientPhone: string;
  address: string;
  service: string;
  startedOn: string;
  lifecycle: ProjectLifecycle;
  completedAt?: string;
  archivedAt?: string;
};

export type Supplier = {
  id: string;
  name: string;
  category: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  lastContactNote?: string;
};

export type Material = {
  id: string;
  projectId: string;
  supplierId?: string;
  name: string;
  quantity?: string;
  status: MaterialStatus;
  expectedOn?: string;
  receivedOn?: string;
  installedOn?: string;
  statusChangedAt: string;
  proofNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type TrackerDataV2 = {
  schemaVersion: 2;
  activeProjectId?: string;
  projects: Project[];
  suppliers: Supplier[];
  materials: Material[];
};

export type StorageEnvelope = {
  datasetKind: DatasetKind;
  schemaVersion: 2;
  data: TrackerDataV2;
  writtenAt: string;
};
