import { createAccessReadinessReport } from "./accessReadiness";
import { createBackendReleaseGateReport } from "./backendReleaseGate";
import { createDataSafetyInventory } from "./dataSafetyInventory";
import { createDeletionRequest, summarizeDeletionRequest } from "./deletionWorkflow";
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
      "data export/import and diagnostics are tested",
      "Data Safety technical inventory is local-first",
      "deletion workflow is modeled without remote endpoint",
    ],
    humanBlockers: uniqueSorted([
      ...gate.knownBlockers,
      ...access.blockers,
      ...storage.blockers,
      ...dataSafety.blockers,
      "Play Console account and signing credentials",
      "signed Android App Bundle upload",
    ]),
    evidence: uniqueSorted([
      "src/backend/playPreflight.ts",
      "src/__tests__/playPreflight.test.ts",
      "docs/backend/release-manifest-v1.json",
      ...gate.evidence,
      ...access.evidence,
      ...storage.evidence,
      ...dataSafety.items.flatMap((item) => item.evidence),
    ]),
  };
}
