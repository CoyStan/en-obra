// Canonical tracker types for schema v2 — re-exported from domain/en-obra.
// Components should import from here, not directly from domain.

export type {
  Material,
  MaterialStatus,
  Project,
  ProjectLifecycle,
  Supplier,
  TrackerDataV2,
  DatasetKind,
} from "../domain/en-obra/types";

export type { NewMaterialInput, MaterialDetailsUpdateInput } from "../domain/en-obra/materials";
export type { NewProjectInput, ProjectUpdateInput } from "../domain/en-obra/projects";

// Store-level supplier input types (defined in store to avoid circular deps)
export type { NewSupplierInput, SupplierUpdateInput, RegisterContactInput } from "./useEnObraStore";

/** Bottom-tab identifiers for the mobile UI. */
export type TrackerTab = "home" | "jobs" | "suppliers";

/** Shape used by MaterialStatusComposer → parent → store.changeMaterialStatus. */
export type MaterialStatusUpdateInput = {
  expectedOn?: string;
  status: "to_order" | "ordered" | "received" | "installed";
  receivedOn?: string;
};
