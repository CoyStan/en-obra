import { createAccessReadinessReport } from "./accessReadiness";
import { createBackendReleaseGateReport } from "./backendReleaseGate";
import { createDataSafetyInventory } from "./dataSafetyInventory";
import { createPlayDataSafetyDraft } from "./playDataSafetyDraft";
import { createPlayPreflightReport } from "./playPreflight";
import { createReleasePrivacyScan, type ReleasePrivacyScanInput } from "./releasePrivacyScan";
import { createRetentionReadinessReport } from "./retentionReadiness";
import type { SecretSafetyTarget } from "./secretSafetyScan";
import { createSecretSafetyScan } from "./secretSafetyScan";
import { createStorageReadinessReport } from "./storageReadiness";

export type ReleaseHandoffInput = {
  generatedAt: string;
  releaseConfig: ReleasePrivacyScanInput;
  secretScanTargets: SecretSafetyTarget[];
};

export type ReleaseHandoffSummary = {
  generatedAt: string;
  app: "Cuentas Claras";
  target: "play-internal-testing";
  status: "ready-for-local-internal-testing" | "blocked";
  backendGateStatus: "pass" | "fail";
  readiness: {
    localBackendReady: boolean;
    accessReadyForInternalTesting: boolean;
    storageReadyForInternalTesting: boolean;
    retentionReadyForInternalTesting: boolean;
    playDataSafetyDraftReady: boolean;
    privacyScanPassed: boolean;
    secretSafetyScanPassed: boolean;
  };
  demoOnly: string[];
  noGoGuarantees: string[];
  humanBlockers: string[];
  nextHumanActions: string[];
  evidence: string[];
  commands: string[];
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}

export function createReleaseHandoffSummary(input: ReleaseHandoffInput): ReleaseHandoffSummary {
  const gate = createBackendReleaseGateReport(input.generatedAt);
  const preflight = createPlayPreflightReport(input.generatedAt);
  const access = createAccessReadinessReport();
  const storage = createStorageReadinessReport();
  const retention = createRetentionReadinessReport();
  const privacyScan = createReleasePrivacyScan(input.releaseConfig);
  const secretSafety = createSecretSafetyScan(input.secretScanTargets);
  const dataSafety = createDataSafetyInventory();
  const playDataSafetyDraft = createPlayDataSafetyDraft({
    generatedAt: input.generatedAt,
    privacyScan,
    secretSafety,
    inventory: dataSafety,
  });
  const ready =
    preflight.status === "ready-for-internal-testing" &&
    gate.status === "pass" &&
    access.internalTestingStatus === "ready" &&
    storage.internalTestingStatus === "ready" &&
    retention.internalTestingStatus === "ready" &&
    privacyScan.status === "pass" &&
    secretSafety.status === "pass" &&
    playDataSafetyDraft.status === "technical-draft";

  return {
    generatedAt: input.generatedAt,
    app: "Cuentas Claras",
    target: "play-internal-testing",
    status: ready ? "ready-for-local-internal-testing" : "blocked",
    backendGateStatus: gate.status,
    readiness: {
      localBackendReady: preflight.localBackendReady,
      accessReadyForInternalTesting: access.internalTestingStatus === "ready",
      storageReadyForInternalTesting: storage.internalTestingStatus === "ready",
      retentionReadyForInternalTesting: retention.internalTestingStatus === "ready",
      playDataSafetyDraftReady: playDataSafetyDraft.status === "technical-draft",
      privacyScanPassed: privacyScan.status === "pass",
      secretSafetyScanPassed: secretSafety.status === "pass",
    },
    demoOnly: [
      "local mock account/session",
      "local AsyncStorage persistence",
      "local sync adapter and outbox",
      "external settlement recording only",
      "technical Play Data Safety draft only",
    ],
    noGoGuarantees: [
      "no real payments",
      "no production backend sync",
      "no committed release secrets",
      "no ads, analytics, payment, location, or contacts SDK signals",
      "no legal approval or Play Console submission",
    ],
    humanBlockers: uniqueSorted([
      ...preflight.humanBlockers,
      ...playDataSafetyDraft.humanBlockers,
      "founder access/provider decision",
      "founder storage/provider decision",
    ]),
    nextHumanActions: [
      "Choose production auth/access provider.",
      "Choose production storage/backend provider and data region.",
      "Approve or revise privacy, retention, deletion, and support promises.",
      "Host approved privacy policy and deletion URL.",
      "Create signed Android App Bundle and upload to Play internal testing.",
      "Complete Play Console Data Safety answers from the technical draft.",
    ],
    evidence: uniqueSorted([
      "src/backend/releaseHandoff.ts",
      "src/__tests__/releaseHandoff.test.ts",
      "docs/backend/release-handoff-v1.json",
      "docs/backend/release-manifest-v1.json",
      "docs/backend/play-preflight-v1.json",
      ...gate.evidence,
      ...preflight.evidence,
      ...playDataSafetyDraft.evidence,
      ...secretSafety.scannedPaths,
    ]),
    commands: [
      "npm run release:android:check",
      "./bin/company-os validate",
      "./bin/company-os scope WORK-APP-0049",
    ],
  };
}

export function createReleaseHandoffSummaryJson(input: ReleaseHandoffInput) {
  return `${JSON.stringify(createReleaseHandoffSummary(input), null, 2)}\n`;
}

