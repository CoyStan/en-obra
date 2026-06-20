export type StorageReadinessMode = "local-async-storage" | "provider-candidate" | "production-configured";

export type StorageReadinessStatus = "ready" | "blocked";

export type StorageCapability =
  | "durable-local-cache"
  | "schema-versioning"
  | "integrity-repair"
  | "offline-mutation-queue"
  | "export-package"
  | "import-validation"
  | "delete-local-data"
  | "conflict-policy"
  | "remote-persistence"
  | "server-side-backups"
  | "regional-data-decision"
  | "remote-delete-fulfillment"
  | "security-review";

export type StorageRequirement = {
  id: StorageCapability;
  label: string;
  internalTestingRequired: boolean;
  productionRequired: boolean;
};

export type StorageProviderReadinessConfig = {
  providerId: string;
  mode: StorageReadinessMode;
  capabilities: StorageCapability[];
  secretsConfigured: boolean;
  productionEndpointConfigured: boolean;
  dataRegionSelected: boolean;
  remoteDeletionFulfillmentConfigured: boolean;
};

export type StorageReadinessReport = {
  providerId: string;
  mode: StorageReadinessMode;
  internalTestingStatus: StorageReadinessStatus;
  productionStatus: StorageReadinessStatus;
  providerSelectedForProduction: boolean;
  missingInternalTestingCapabilities: StorageCapability[];
  missingProductionCapabilities: StorageCapability[];
  blockers: string[];
  evidence: string[];
};

export const STORAGE_REQUIREMENTS: StorageRequirement[] = [
  {
    id: "durable-local-cache",
    label: "Durable local cache",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "schema-versioning",
    label: "Schema versioning",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "integrity-repair",
    label: "Integrity audit and repair",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "offline-mutation-queue",
    label: "Offline mutation queue",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "export-package",
    label: "Local export package",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "import-validation",
    label: "Import validation",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "delete-local-data",
    label: "Local data deletion",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "conflict-policy",
    label: "Conflict policy",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "remote-persistence",
    label: "Remote persistence",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "server-side-backups",
    label: "Server-side backup and recovery process",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "regional-data-decision",
    label: "Data region decision",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "remote-delete-fulfillment",
    label: "Remote deletion fulfillment",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "security-review",
    label: "Security review",
    internalTestingRequired: false,
    productionRequired: true,
  },
];

export const LOCAL_ASYNC_STORAGE_CONFIG: StorageProviderReadinessConfig = {
  providerId: "local-async-storage",
  mode: "local-async-storage",
  capabilities: [
    "durable-local-cache",
    "schema-versioning",
    "integrity-repair",
    "offline-mutation-queue",
    "export-package",
    "import-validation",
    "delete-local-data",
    "conflict-policy",
  ],
  secretsConfigured: false,
  productionEndpointConfigured: false,
  dataRegionSelected: false,
  remoteDeletionFulfillmentConfigured: false,
};

function missingCapabilities(
  config: StorageProviderReadinessConfig,
  predicate: (requirement: StorageRequirement) => boolean,
) {
  const available = new Set(config.capabilities);

  return STORAGE_REQUIREMENTS
    .filter(predicate)
    .map((requirement) => requirement.id)
    .filter((id) => !available.has(id));
}

export function createStorageReadinessReport(
  config: StorageProviderReadinessConfig = LOCAL_ASYNC_STORAGE_CONFIG,
): StorageReadinessReport {
  const missingInternalTestingCapabilities = missingCapabilities(
    config,
    (requirement) => requirement.internalTestingRequired,
  );
  const missingProductionCapabilities = missingCapabilities(
    config,
    (requirement) => requirement.productionRequired,
  );
  const blockers = [
    config.mode !== "production-configured" ? "production-storage-provider" : "",
    config.secretsConfigured ? "" : "production-storage-secrets",
    config.productionEndpointConfigured ? "" : "production-storage-endpoint",
    config.dataRegionSelected ? "" : "regional-data-decision",
    config.remoteDeletionFulfillmentConfigured ? "" : "remote-deletion-fulfillment",
    ...missingProductionCapabilities.map((id) => `missing-production-capability:${id}`),
  ].filter(Boolean);

  return {
    providerId: config.providerId,
    mode: config.mode,
    internalTestingStatus: missingInternalTestingCapabilities.length === 0 ? "ready" : "blocked",
    productionStatus: blockers.length === 0 ? "ready" : "blocked",
    providerSelectedForProduction: config.mode === "production-configured",
    missingInternalTestingCapabilities,
    missingProductionCapabilities,
    blockers,
    evidence: [
      "src/backend/asyncStorageRepository.ts",
      "src/backend/repository.ts",
      "src/backend/sqlSchema.ts",
      "src/backend/dataIntegrity.ts",
      "src/backend/syncOutbox.ts",
      "src/backend/syncConflictPolicy.ts",
      "src/backend/dataExport.ts",
      "src/backend/dataImport.ts",
      "docs/production/backend-sync-architecture.md",
    ],
  };
}
