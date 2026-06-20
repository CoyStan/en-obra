import { createAccessReadinessReport } from "./accessReadiness";
import { createBackendReleaseGateReport } from "./backendReleaseGate";
import { createDataSafetyInventory } from "./dataSafetyInventory";
import { createDeletionRequest, summarizeDeletionRequest } from "./deletionWorkflow";
import { createRetentionReadinessReport } from "./retentionReadiness";
import { createStorageReadinessReport } from "./storageReadiness";

export type PlayPreflightStatus = "ready-for-internal-testing" | "blocked";

export type PlayPreflightReport = {
  generatedAt: string;
  target: "play-internal-testing";
  status: PlayPreflightStatus;
  backendGateStatus: "pass" | "fail";
  localBackendReady: boolean;
  realPaymentsEnabled: false;
  remoteBackendEnabled: false;
  readySignals: string[];
  humanBlockers: string[];
  evidence: string[];
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}

export function createPlayPreflightReport(generatedAt: string): PlayPreflightReport {
  const gate = createBackendReleaseGateReport(generatedAt);
  const access = createAccessReadinessReport();
  const storage = createStorageReadinessReport();
  const retention = createRetentionReadinessReport();
  const dataSafety = createDataSafetyInventory();
  const deletion = createDeletionRequest({
    id: "preflight-deletion-check",
    accountId: "local-preflight-account",
    scope: "future-remote-account",
    requestedAt: generatedAt,
  });
  const deletionSummary = deletion.ok ? summarizeDeletionRequest(deletion.request) : null;

  const localBackendReady =
    gate.status === "pass" &&
    access.internalTestingStatus === "ready" &&
    storage.internalTestingStatus === "ready" &&
    retention.internalTestingStatus === "ready" &&
    dataSafety.remoteBackendEnabled === false &&
    dataSafety.realPaymentsEnabled === false &&
    deletionSummary?.remoteEndpointConfigured === false;

  return {
    generatedAt,
    target: "play-internal-testing",
    status: localBackendReady ? "ready-for-internal-testing" : "blocked",
    backendGateStatus: gate.status,
    localBackendReady,
    realPaymentsEnabled: false,
    remoteBackendEnabled: false,
    readySignals: [
      "backend release gate passes",
      "SQL schema and demo seed are deterministic",
      "local repository and AsyncStorage adapter are tested",
      "access model is ready for local internal testing",
      "storage model is ready for local internal testing",
      "retention and backup model is ready for local internal testing",
      "data export/import and diagnostics are tested",
      "Data Safety technical inventory is local-first",
      "technical Play Data Safety draft is generated from current scans",
      "backend release handoff summary is deterministic",
      "release config has no committed secrets or production endpoints",
      "deletion workflow is modeled without remote endpoint",
    ],
    humanBlockers: uniqueSorted([
      ...gate.knownBlockers,
      ...access.blockers,
      ...storage.blockers,
      ...retention.blockers,
      ...dataSafety.blockers,
      "Play Console account and signing credentials",
      "signed Android App Bundle upload",
    ]),
    evidence: uniqueSorted([
      "src/backend/playPreflight.ts",
      "src/__tests__/playPreflight.test.ts",
      "src/backend/playDataSafetyDraft.ts",
      "src/__tests__/playDataSafetyDraft.test.ts",
      "src/backend/releaseHandoff.ts",
      "src/__tests__/releaseHandoff.test.ts",
      "src/backend/secretSafetyScan.ts",
      "src/__tests__/secretSafetyScan.test.ts",
      "docs/backend/release-manifest-v1.json",
      ...gate.evidence,
      ...access.evidence,
      ...storage.evidence,
      ...retention.evidence,
      ...dataSafety.items.flatMap((item) => item.evidence),
    ]),
  };
}

export function createPlayPreflightReportJson(generatedAt: string) {
  return `${JSON.stringify(createPlayPreflightReport(generatedAt), null, 2)}\n`;
}
