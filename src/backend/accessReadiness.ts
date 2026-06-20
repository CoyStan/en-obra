export type AccessReadinessMode = "local-mock" | "provider-candidate" | "production-configured";

export type AccessReadinessStatus = "ready" | "blocked";

export type AccessCapability =
  | "stable-user-id"
  | "session-restore"
  | "sign-out"
  | "group-identity-mapping"
  | "offline-guest-mode"
  | "local-data-export"
  | "verified-session"
  | "account-deletion-request"
  | "remote-deletion-status"
  | "privacy-policy-url";

export type AccessRequirement = {
  id: AccessCapability;
  label: string;
  internalTestingRequired: boolean;
  productionRequired: boolean;
};

export type AccessProviderReadinessConfig = {
  providerId: string;
  mode: AccessReadinessMode;
  capabilities: AccessCapability[];
  secretsConfigured: boolean;
  remoteDeletionEndpointConfigured: boolean;
  publicPrivacyUrlConfigured: boolean;
};

export type AccessReadinessReport = {
  providerId: string;
  mode: AccessReadinessMode;
  internalTestingStatus: AccessReadinessStatus;
  productionStatus: AccessReadinessStatus;
  providerSelectedForProduction: boolean;
  missingInternalTestingCapabilities: AccessCapability[];
  missingProductionCapabilities: AccessCapability[];
  blockers: string[];
  evidence: string[];
};

export const ACCESS_REQUIREMENTS: AccessRequirement[] = [
  {
    id: "stable-user-id",
    label: "Stable user id",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "session-restore",
    label: "Session restore boundary",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "sign-out",
    label: "Sign-out boundary",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "group-identity-mapping",
    label: "Active group member identity mapping",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "offline-guest-mode",
    label: "Offline guest mode",
    internalTestingRequired: true,
    productionRequired: false,
  },
  {
    id: "local-data-export",
    label: "Local data export path",
    internalTestingRequired: true,
    productionRequired: true,
  },
  {
    id: "verified-session",
    label: "Verified production session",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "account-deletion-request",
    label: "Account deletion request flow",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "remote-deletion-status",
    label: "Remote deletion status tracking",
    internalTestingRequired: false,
    productionRequired: true,
  },
  {
    id: "privacy-policy-url",
    label: "Public privacy policy URL",
    internalTestingRequired: false,
    productionRequired: true,
  },
];

export const LOCAL_MOCK_ACCESS_CONFIG: AccessProviderReadinessConfig = {
  providerId: "local-mock",
  mode: "local-mock",
  capabilities: [
    "stable-user-id",
    "session-restore",
    "sign-out",
    "group-identity-mapping",
    "offline-guest-mode",
    "local-data-export",
  ],
  secretsConfigured: false,
  remoteDeletionEndpointConfigured: false,
  publicPrivacyUrlConfigured: false,
};

function missingCapabilities(
  config: AccessProviderReadinessConfig,
  predicate: (requirement: AccessRequirement) => boolean,
) {
  const available = new Set(config.capabilities);

  return ACCESS_REQUIREMENTS
    .filter(predicate)
    .map((requirement) => requirement.id)
    .filter((id) => !available.has(id));
}

export function createAccessReadinessReport(
  config: AccessProviderReadinessConfig = LOCAL_MOCK_ACCESS_CONFIG,
): AccessReadinessReport {
  const missingInternalTestingCapabilities = missingCapabilities(
    config,
    (requirement) => requirement.internalTestingRequired,
  );
  const missingProductionCapabilities = missingCapabilities(
    config,
    (requirement) => requirement.productionRequired,
  );
  const blockers = [
    config.mode !== "production-configured" ? "production-auth-provider" : "",
    config.secretsConfigured ? "" : "production-auth-secrets",
    config.remoteDeletionEndpointConfigured ? "" : "remote-deletion-endpoint",
    config.publicPrivacyUrlConfigured ? "" : "public-privacy-policy-url",
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
      "src/auth/types.ts",
      "src/auth/localAccountAdapter.ts",
      "src/auth/accountValidation.ts",
      "src/backend/accessReadiness.ts",
      "docs/production/auth-account-model.md",
      "docs/production/security-data-deletion.md",
    ],
  };
}
