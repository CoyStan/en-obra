import { createSqlDataset, createSqlSnapshot } from "./sqlDataset";
import { SQL_SCHEMA_VERSION } from "./sqlSchema";
import { SQL_MIGRATIONS, planSqlMigrations } from "./sqlMigrations";
import { demoData } from "../data/demoData";
import { auditAppDataIntegrity } from "./dataIntegrity";
import { createAccessReadinessReport } from "./accessReadiness";
import { createStorageReadinessReport } from "./storageReadiness";
import { createDataSafetyInventory } from "./dataSafetyInventory";

export type BackendReadinessItem = {
  id: string;
  label: string;
  status: "ready" | "blocked";
  evidence: string[];
  blocker?: string;
};

export type BackendReadinessReport = {
  generatedAt: string;
  releaseTarget: "play-internal-testing";
  readinessPercent: number;
  items: BackendReadinessItem[];
  blockers: BackendReadinessItem[];
};

function item(
  id: string,
  label: string,
  status: BackendReadinessItem["status"],
  evidence: string[],
  blocker?: string,
): BackendReadinessItem {
  return { id, label, status, evidence, blocker };
}

export function createBackendReadinessReport(generatedAt: string): BackendReadinessReport {
  const dataset = createSqlDataset(demoData);
  const snapshot = createSqlSnapshot(demoData);
  const integrityIssues = auditAppDataIntegrity(demoData);
  const migrationPlan = planSqlMigrations(SQL_SCHEMA_VERSION);
  const accessReadiness = createAccessReadinessReport();
  const storageReadiness = createStorageReadinessReport();
  const dataSafetyInventory = createDataSafetyInventory();

  const items: BackendReadinessItem[] = [
    item("sql-schema", "SQL schema contract", "ready", [
      `SQL_SCHEMA_VERSION=${SQL_SCHEMA_VERSION}`,
      `${snapshot.tableNames.length} SQL tables`,
      "docs/backend/schema-v1.sql",
    ]),
    item("sql-seed", "SQL demo seed dataset", "ready", [
      `${dataset.users.length} users`,
      `${dataset.groups.length} groups`,
      `${dataset.expenses.length} expenses`,
      "docs/backend/seed-demo-v1.sql",
    ]),
    item("integrity", "Local data integrity guard", integrityIssues.length === 0 ? "ready" : "blocked", [
      `${integrityIssues.length} demo integrity issues`,
      "src/backend/dataIntegrity.ts",
    ], integrityIssues.length ? "Demo data integrity issues must be repaired." : undefined),
    item("mutations", "Backend mutation service", "ready", [
      "src/backend/appMutations.ts",
      "src/__tests__/appMutations.test.ts",
    ]),
    item("repository", "Repository contract", "ready", [
      "src/backend/repository.ts",
      "src/__tests__/repository.test.ts",
    ]),
    item("local-storage-adapter", "AsyncStorage repository adapter", "ready", [
      "src/backend/asyncStorageRepository.ts",
      "src/__tests__/asyncStorageRepository.test.ts",
    ]),
    item(
      "storage-readiness",
      "Provider-neutral storage readiness contract",
      storageReadiness.internalTestingStatus,
      [
        "src/backend/storageReadiness.ts",
        "src/__tests__/storageReadiness.test.ts",
        ...storageReadiness.evidence,
      ],
      storageReadiness.internalTestingStatus === "ready"
        ? undefined
        : "Local/internal testing storage requirements are incomplete.",
    ),
    item("outbox", "Sync outbox lifecycle", "ready", [
      "src/backend/syncOutbox.ts",
      "src/__tests__/syncOutbox.test.ts",
    ]),
    item("sync-engine", "Provider-neutral sync engine", "ready", [
      "src/backend/syncEngine.ts",
      "src/__tests__/syncEngine.test.ts",
    ]),
    item("conflict-policy", "Provider-neutral sync conflict policy", "ready", [
      "src/backend/syncConflictPolicy.ts",
      "src/__tests__/syncConflictPolicy.test.ts",
    ]),
    item("release-manifest", "Backend release manifest", "ready", [
      "src/backend/backendReleaseManifest.ts",
      "src/__tests__/backendReleaseManifest.test.ts",
    ]),
    item("import-restore", "Local export import restore validator", "ready", [
      "src/backend/dataImport.ts",
      "src/__tests__/dataImport.test.ts",
    ]),
    item("diagnostics", "Backend health diagnostics report", "ready", [
      "src/backend/backendDiagnostics.ts",
      "src/__tests__/backendDiagnostics.test.ts",
    ]),
    item("deletion-workflow", "Provider-neutral deletion workflow model", "ready", [
      "src/backend/deletionWorkflow.ts",
      "src/__tests__/deletionWorkflow.test.ts",
    ]),
    item(
      "access-readiness",
      "Provider-neutral account access readiness contract",
      accessReadiness.internalTestingStatus,
      [
        "src/backend/accessReadiness.ts",
        "src/__tests__/accessReadiness.test.ts",
        ...accessReadiness.evidence,
      ],
      accessReadiness.internalTestingStatus === "ready"
        ? undefined
        : "Local/internal testing access requirements are incomplete.",
    ),
    item(
      "data-safety-inventory",
      "Technical Data Safety inventory",
      dataSafetyInventory.legalSubmissionReady ? "blocked" : "ready",
      [
        "src/backend/dataSafetyInventory.ts",
        "src/__tests__/dataSafetyInventory.test.ts",
        "docs/production/privacy-terms-readiness.md",
      ],
    ),
    item("release-privacy-scan", "Release privacy and dependency scan", "ready", [
      "src/backend/releasePrivacyScan.ts",
      "src/__tests__/releasePrivacyScan.test.ts",
      "package.json",
      "app.json",
    ]),
    item("export", "Local data export package", "ready", [
      "src/backend/dataExport.ts",
      "src/__tests__/dataExport.test.ts",
    ]),
    item("migrations", "Schema migration planner", migrationPlan.ok && SQL_MIGRATIONS.length === 0 ? "ready" : "blocked", [
      "src/backend/sqlMigrations.ts",
      `registered migrations=${SQL_MIGRATIONS.length}`,
    ], migrationPlan.ok ? undefined : migrationPlan.error),
    item("production-auth", "Production auth provider", "blocked", [
      "docs/production/auth-account-model.md",
    ], "Requires founder decision on access model and provider."),
    item("production-storage", "Production storage/backend provider", "blocked", [
      "docs/production/backend-sync-architecture.md",
    ], "Requires founder decision on where data is stored and synced."),
    item("remote-deletion", "Remote deletion endpoint/process", "blocked", [
      "docs/production/security-data-deletion.md",
    ], "Requires backend provider, public URL, and legal/security approval."),
  ];
  const readyCount = items.filter((entry) => entry.status === "ready").length;

  return {
    generatedAt,
    releaseTarget: "play-internal-testing",
    readinessPercent: Math.round((readyCount / items.length) * 100),
    items,
    blockers: items.filter((entry) => entry.status === "blocked"),
  };
}
