export type RetentionReadinessMode = "local-first-demo" | "provider-candidate" | "production-configured";

export type RetentionReadinessStatus = "ready" | "blocked";

export type RetentionCapability =
  | "local-clear-data"
  | "local-uninstall-clear"
  | "local-export-package"
  | "import-validation"
  | "support-redaction"
  | "retention-policy"
  | "server-side-backups"
  | "backup-restore-drill"
  | "remote-delete-fulfillment"
  | "public-deletion-url"
  | "legal-retention-approval";

export type RetentionRequirement = {
  id: RetentionCapability;
  label: string;
  internalTestingRequired: boolean;
  productionRequired: boolean;
};

export type RetentionReadinessConfig = {
  mode: RetentionReadinessMode;
  capabilities: RetentionCapability[];
  remoteBackupConfigured: boolean;
  remoteDeletionFulfillmentConfigured: boolean;
  publicDeletionUrlConfigured: boolean;
  legalApproved: boolean;
};

export type RetentionReadinessReport = {
  mode: RetentionReadinessMode;
  internalTestingStatus: RetentionReadinessStatus;
  productionStatus: RetentionReadinessStatus;
  localDataRetention: "until-clear-data-uninstall-or-demo-reset";
  cloudBackupEnabled: boolean;
  productionRetentionApproved: boolean;
  missingInternalTestingCapabilities: RetentionCapability[];
  missingProductionCapabilities: RetentionCapability[];
  blockers: string[];
  evidence: string[];
};

export const RETENTION_REQUIREMENTS: RetentionRequirement[] = [
  {
    id: "local-clear-data",
    label: "Local clear-data path",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "local-uninstall-clear",
    label: "Local uninstall clears app sandbox",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "local-export-package",
    label: "Local export package before support or migration",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "import-validation",
    label: "Import validation before restore",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "support-redaction",
    label: "Support evidence redacts raw personal content",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "retention-policy",
    label: "Human-approved production retention policy",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "server-side-backups",
    label: "Server-side backup process",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "backup-restore-drill",
    label: "Backup restore drill",
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
    id: "public-deletion-url",
    label: "Public deletion request URL",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "legal-retention-approval",
    label: "Legal approval for retention promises",
    internalTestingRequired: false,
    productionRequired: true,
  },
];

export const LOCAL_RETENTION_CONFIG: RetentionReadinessConfig = {
  mode: "local-first-demo",
  capabilities: [
    "local-clear-data",
    "local-uninstall-clear",
    "local-export-package",
    "import-validation",
    "support-redaction",
  ],
  remoteBackupConfigured: false,
  remoteDeletionFulfillmentConfigured: false,
  publicDeletionUrlConfigured: false,
  legalApproved: false,
};

function missingCapabilities(
  config: RetentionReadinessConfig,
  predicate: (requirement: RetentionRequirement) => boolean,
) {
  const available = new Set(config.capabilities);

  return RETENTION_REQUIREMENTS
    .filter(predicate)
    .map((requirement) => requirement.id)
    .filter((id) => !available.has(id));
}

export function createRetentionReadinessReport(
  config: RetentionReadinessConfig = LOCAL_RETENTION_CONFIG,
): RetentionReadinessReport {
  const missingInternalTestingCapabilities = missingCapabilities(
    config,
    (requirement) => requirement.internalTestingRequired,
  );
  const missingProductionCapabilities = missingCapabilities(
    config,
    (requirement) => requirement.productionRequired,
  );
  const blockers = [
    config.mode !== "production-configured" ? "production-retention-policy" : "",
    config.remoteBackupConfigured ? "" : "server-side-backups",
    config.remoteDeletionFulfillmentConfigured ? "" : "remote-delete-fulfillment",
    config.publicDeletionUrlConfigured ? "" : "public-deletion-url",
    config.legalApproved ? "" : "legal-retention-approval",
    ...missingProductionCapabilities.map((id) => `missing-production-capability:${id}`),
  ].filter(Boolean);

  return {
    mode: config.mode,
    internalTestingStatus: missingInternalTestingCapabilities.length === 0 ? "ready" : "blocked",
    productionStatus: blockers.length === 0 ? "ready" : "blocked",
    localDataRetention: "until-clear-data-uninstall-or-demo-reset",
    cloudBackupEnabled: config.remoteBackupConfigured,
    productionRetentionApproved: config.mode === "production-configured" && config.legalApproved,
    missingInternalTestingCapabilities,
    missingProductionCapabilities,
    blockers,
    evidence: [
      "src/security/dataDeletion.ts",
      "src/backend/dataExport.ts",
      "src/backend/dataImport.ts",
      "src/backend/supportBundle.ts",
      "src/backend/deletionWorkflow.ts",
      "docs/production/security-data-deletion.md",
      "docs/production/privacy-terms-readiness.md",
    ],
  };
}

