import { createDataSafetyInventory, type DataSafetyCategory, type DataSafetyInventory } from "./dataSafetyInventory";
import type { ReleasePrivacyScanReport } from "./releasePrivacyScan";
import type { SecretSafetyScanReport } from "./secretSafetyScan";

export type PlayDataSafetyDraftStatus = "technical-draft" | "blocked-by-release-risk";

export type PlayDataSafetyDeclaration = {
  category: DataSafetyCategory;
  label: string;
  suggestedAnswer: "not-collected" | "collected-local-only";
  transmittedOffDevice: false;
  sharedWithThirdParties: false;
  userVisible: boolean;
  evidence: string[];
  note: string;
};

export type PlayDataSafetyDraft = {
  generatedAt: string;
  status: PlayDataSafetyDraftStatus;
  legalSubmissionReady: false;
  buildMode: DataSafetyInventory["buildMode"];
  summary: {
    dataTransmittedToCuentasClarasServers: false;
    dataSharedWithThirdParties: false;
    realPaymentsEnabled: false;
    adsEnabled: false;
    analyticsEnabled: false;
    productionBackendEnabled: false;
  };
  declarations: PlayDataSafetyDeclaration[];
  releaseRisks: string[];
  humanBlockers: string[];
  evidence: string[];
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}

export function createPlayDataSafetyDraft(input: {
  generatedAt: string;
  privacyScan: ReleasePrivacyScanReport;
  secretSafety: SecretSafetyScanReport;
  inventory?: DataSafetyInventory;
}): PlayDataSafetyDraft {
  const inventory = input.inventory ?? createDataSafetyInventory();
  const releaseRisks = [
    ...input.privacyScan.risks.map((risk) => `${risk.kind}:${risk.name}`),
    ...input.secretSafety.risks.map((risk) => `${risk.kind}:${risk.path}`),
  ];
  const declarations = inventory.items.map((item) => ({
    category: item.id,
    label: item.label,
    suggestedAnswer: item.handling === "not-collected" ? "not-collected" as const : "collected-local-only" as const,
    transmittedOffDevice: false as const,
    sharedWithThirdParties: false as const,
    userVisible: item.userVisible,
    evidence: item.evidence,
    note: item.note,
  }));

  return {
    generatedAt: input.generatedAt,
    status: releaseRisks.length === 0 ? "technical-draft" : "blocked-by-release-risk",
    legalSubmissionReady: false,
    buildMode: inventory.buildMode,
    summary: {
      dataTransmittedToCuentasClarasServers: false,
      dataSharedWithThirdParties: false,
      realPaymentsEnabled: inventory.realPaymentsEnabled,
      adsEnabled: inventory.adsEnabled,
      analyticsEnabled: inventory.analyticsEnabled,
      productionBackendEnabled: inventory.remoteBackendEnabled,
    },
    declarations,
    releaseRisks,
    humanBlockers: uniqueSorted([
      ...inventory.blockers,
      "human review of Play Console wording",
      "approved public privacy policy URL",
    ]),
    evidence: uniqueSorted([
      "src/backend/playDataSafetyDraft.ts",
      "src/__tests__/playDataSafetyDraft.test.ts",
      "src/backend/dataSafetyInventory.ts",
      "src/backend/releasePrivacyScan.ts",
      "src/backend/secretSafetyScan.ts",
      ...inventory.items.flatMap((item) => item.evidence),
      ...input.secretSafety.scannedPaths,
    ]),
  };
}

