export type MaterialStatus = "to_order" | "ordered" | "received" | "installed";
export type SupplierPaymentStatus = "pending" | "deposit_paid" | "paid";
export type TrackerTab = "home" | "materials" | "suppliers" | "client";

export type Supplier = {
  id: string;
  name: string;
  category: string;
  phone: string;
  lastContactAt: string;
  lastContactNote: string;
};

export type Material = {
  id: string;
  projectId: string;
  supplierId: string;
  name: string;
  quantity: string;
  priceCents: number;
  status: MaterialStatus;
  paymentStatus: SupplierPaymentStatus;
  expectedOn?: string;
  receivedOn?: string;
  proofNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  clientName: string;
  clientPhone: string;
  address: string;
  service: string;
  startedOn: string;
};

export type TrackerData = {
  version: 1;
  demoRevision?: number;
  activeProjectId: string;
  projects: Project[];
  suppliers: Supplier[];
  materials: Material[];
};

export type NewMaterialInput = {
  name: string;
  quantity: string;
  supplierId: string;
  price: string;
  expectedOn?: string;
};

export type MaterialStatusUpdateInput = {
  expectedOn?: string;
  status: MaterialStatus;
  receivedOn?: string;
};

export type NewProjectInput = {
  name: string;
  clientName: string;
  clientPhone?: string;
  address?: string;
};

export type NewSupplierInput = {
  name: string;
  phone?: string;
  category?: string;
  lastContactNote?: string;
};

export type MaterialDetailsUpdateInput = {
  name: string;
  quantity: string;
  supplierId: string;
  expectedOn?: string;
};

export type ProjectUpdateInput = {
  name: string;
  clientName: string;
  clientPhone?: string;
  address?: string;
};

export type SupplierUpdateInput = {
  name: string;
  phone?: string;
  category?: string;
  lastContactNote?: string;
};

export type GoogleDriveEvidencePlan = {
  mode: "not_connected" | "connected";
  folderName?: string;
};
