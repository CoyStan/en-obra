import { createSqlDataset, createSqlSnapshot } from "./sqlDataset";
import { SQL_SCHEMA_VERSION } from "./sqlSchema";
import { SQL_MIGRATIONS, planSqlMigrations } from "./sqlMigrations";
import { demoData } from "../data/demoData";
import { auditAppDataIntegrity } from "./dataIntegrity";

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
