import { createBackendDiagnosticsReport, type BackendDiagnosticsReport } from "./backendDiagnostics";
import { createBackendReleaseManifest, type BackendReleaseManifest } from "./backendReleaseManifest";
import { createDataSafetyInventory, type DataSafetyHandling } from "./dataSafetyInventory";
import { createPlayDataSafetyDraft, type PlayDataSafetyDraft } from "./playDataSafetyDraft";
import { createPlayPreflightReport, type PlayPreflightStatus } from "./playPreflight";
import { createReleaseHandoffSummary, type ReleaseHandoffSummary } from "./releaseHandoff";
import { createReleasePrivacyScan, type ReleasePrivacyScanReport } from "./releasePrivacyScan";
import { createRetentionReadinessReport, type RetentionReadinessReport } from "./retentionReadiness";
import type { BackendSnapshot } from "./repository";
import { createSecretSafetyScan, type SecretSafetyScanReport, type SecretSafetyTarget } from "./secretSafetyScan";

export type RedactedSupportBundle = {
  generatedAt: string;
  app: "Cuentas Claras";
  target: "play-internal-testing";
  redaction: {
    rawUserRowsIncluded: false;
    rawExpenseRowsIncluded: false;
    rawOutboxPayloadsIncluded: false;
    accountContactIncluded: false;
  };
  diagnostics: BackendDiagnosticsReport;
  preflight: {
    status: PlayPreflightStatus;
    localBackendReady: boolean;
    readySignals: string[];
    humanBlockers: string[];
  };
  releaseManifest: {
    version: BackendReleaseManifest["version"];
    backendMode: BackendReleaseManifest["backendMode"];
    realPaymentsEnabled: BackendReleaseManifest["realPaymentsEnabled"];
    schemaVersion: BackendReleaseManifest["schemaVersion"];
    requiredCapabilities: string[];
    readyCapabilities: string[];
    knownBlockers: string[];
    unexpectedBlockers: string[];
  };
  handoff: {
    status: ReleaseHandoffSummary["status"];
    demoOnly: string[];
    noGoGuarantees: string[];
    nextHumanActions: string[];
  };
  privacy: {
    scan: ReleasePrivacyScanReport;
    secretSafety: SecretSafetyScanReport;
    playDataSafetyDraft: {
      status: PlayDataSafetyDraft["status"];
      legalSubmissionReady: false;
      humanBlockers: string[];
      releaseRisks: string[];
    };
    dataSafety: {
      legalSubmissionReady: false;
      remoteBackendEnabled: false;
      realPaymentsEnabled: false;
      handlingByCategory: Record<string, DataSafetyHandling>;
      blockers: string[];
    };
  };
  retention: {
    localDataRetention: RetentionReadinessReport["localDataRetention"];
    cloudBackupEnabled: boolean;
    productionStatus: RetentionReadinessReport["productionStatus"];
    blockers: string[];
  };
};

export function createRedactedSupportBundle(
  snapshot: BackendSnapshot,
  generatedAt: string,
  releaseConfig: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    androidPermissions: string[];
    secretScanTargets?: SecretSafetyTarget[];
  },
): RedactedSupportBundle {
  const diagnostics = createBackendDiagnosticsReport(snapshot, generatedAt);
  const preflight = createPlayPreflightReport(generatedAt);
  const manifest = createBackendReleaseManifest(generatedAt);
  const scan = createReleasePrivacyScan(releaseConfig);
  const secretSafety = createSecretSafetyScan(releaseConfig.secretScanTargets ?? []);
  const dataSafety = createDataSafetyInventory();
  const playDataSafetyDraft = createPlayDataSafetyDraft({
    generatedAt,
    privacyScan: scan,
    secretSafety,
    inventory: dataSafety,
  });
  const handoff = createReleaseHandoffSummary({
    generatedAt,
    releaseConfig,
    secretScanTargets: releaseConfig.secretScanTargets ?? [],
  });
  const retention = createRetentionReadinessReport();

  return {
    generatedAt,
    app: "Cuentas Claras",
    target: "play-internal-testing",
    redaction: {
      rawUserRowsIncluded: false,
      rawExpenseRowsIncluded: false,
      rawOutboxPayloadsIncluded: false,
      accountContactIncluded: false,
    },
    diagnostics,
    preflight: {
      status: preflight.status,
      localBackendReady: preflight.localBackendReady,
      readySignals: preflight.readySignals,
      humanBlockers: preflight.humanBlockers,
    },
    releaseManifest: {
      version: manifest.version,
      backendMode: manifest.backendMode,
      realPaymentsEnabled: manifest.realPaymentsEnabled,
      schemaVersion: manifest.schemaVersion,
      requiredCapabilities: manifest.requiredCapabilities,
      readyCapabilities: manifest.readyCapabilities,
      knownBlockers: manifest.knownBlockers,
      unexpectedBlockers: manifest.unexpectedBlockers,
    },
    handoff: {
      status: handoff.status,
      demoOnly: handoff.demoOnly,
      noGoGuarantees: handoff.noGoGuarantees,
      nextHumanActions: handoff.nextHumanActions,
    },
    privacy: {
      scan,
      secretSafety,
      playDataSafetyDraft: {
        status: playDataSafetyDraft.status,
        legalSubmissionReady: false,
        humanBlockers: playDataSafetyDraft.humanBlockers,
        releaseRisks: playDataSafetyDraft.releaseRisks,
      },
      dataSafety: {
        legalSubmissionReady: false,
        remoteBackendEnabled: false,
        realPaymentsEnabled: false,
        handlingByCategory: Object.fromEntries(dataSafety.items.map((item) => [item.id, item.handling])),
        blockers: dataSafety.blockers,
      },
    },
    retention: {
      localDataRetention: retention.localDataRetention,
      cloudBackupEnabled: retention.cloudBackupEnabled,
      productionStatus: retention.productionStatus,
      blockers: retention.blockers,
    },
  };
}
