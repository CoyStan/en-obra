export type DataSafetyCategory =
  | "account-info"
  | "contacts"
  | "financial-info"
  | "app-activity"
  | "diagnostics"
  | "payments"
  | "location"
  | "advertising";

export type DataSafetyHandling = "not-collected" | "local-only" | "future-backend-blocked";

export type DataSafetyItem = {
  id: DataSafetyCategory;
  label: string;
  handling: DataSafetyHandling;
  sharedWithThirdParties: boolean;
  userVisible: boolean;
  evidence: string[];
  note: string;
};

export type DataSafetyInventory = {
  buildMode: "local-first-demo";
  realPaymentsEnabled: false;
  adsEnabled: false;
  analyticsEnabled: false;
  remoteBackendEnabled: false;
  legalSubmissionReady: false;
  items: DataSafetyItem[];
  blockers: string[];
};

export function createDataSafetyInventory(): DataSafetyInventory {
  const items: DataSafetyItem[] = [
    {
      id: "account-info",
      label: "Account info",
      handling: "local-only",
      sharedWithThirdParties: false,
      userVisible: true,
      evidence: ["src/auth/types.ts", "src/auth/localAccountAdapter.ts", "docs/production/auth-account-model.md"],
      note: "Local mock profile can contain display name and email; no production auth provider is configured.",
    },
    {
      id: "contacts",
      label: "Contacts",
      handling: "not-collected",
      sharedWithThirdParties: false,
      userVisible: false,
      evidence: ["src/domain/types.ts", "docs/legal/privacy-policy-draft.md"],
      note: "The app stores manually entered group member names, not device contacts.",
    },
    {
      id: "financial-info",
      label: "Financial info",
      handling: "local-only",
      sharedWithThirdParties: false,
      userVisible: true,
      evidence: ["src/domain/types.ts", "src/backend/sqlSchema.ts", "docs/backend/sql-readiness.md"],
      note: "User-entered expense amounts and settlement records stay local in this build.",
    },
    {
      id: "app-activity",
      label: "App activity",
      handling: "local-only",
      sharedWithThirdParties: false,
      userVisible: true,
      evidence: ["src/domain/types.ts", "src/backend/dataExport.ts", "docs/backend/sql-readiness.md"],
      note: "Activity history and sync outbox rows stay on device until a backend is selected.",
    },
    {
      id: "diagnostics",
      label: "Diagnostics",
      handling: "local-only",
      sharedWithThirdParties: false,
      userVisible: false,
      evidence: ["src/backend/backendDiagnostics.ts", "docs/backend/release-readiness-audit.md"],
      note: "Support-safe diagnostics are generated locally; no analytics or crash SDK is configured.",
    },
    {
      id: "payments",
      label: "Payments",
      handling: "not-collected",
      sharedWithThirdParties: false,
      userVisible: true,
      evidence: ["src/backend/backendReleaseManifest.ts", "docs/production/play-readiness.md"],
      note: "The build records external settlements only and does not process real payments.",
    },
    {
      id: "location",
      label: "Location",
      handling: "not-collected",
      sharedWithThirdParties: false,
      userVisible: false,
      evidence: ["app.json", "docs/production/play-readiness.md"],
      note: "No location permission or location SDK is configured.",
    },
    {
      id: "advertising",
      label: "Advertising",
      handling: "not-collected",
      sharedWithThirdParties: false,
      userVisible: false,
      evidence: ["package.json", "docs/production/play-readiness.md"],
      note: "No ads or analytics SDK is configured.",
    },
  ];

  return {
    buildMode: "local-first-demo",
    realPaymentsEnabled: false,
    adsEnabled: false,
    analyticsEnabled: false,
    remoteBackendEnabled: false,
    legalSubmissionReady: false,
    items,
    blockers: [
      "human legal/privacy approval",
      "public privacy policy URL",
      "final Play Console Data Safety answers",
      "production auth/storage provider decision",
    ],
  };
}
