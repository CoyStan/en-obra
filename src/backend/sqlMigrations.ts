import { SQL_SCHEMA_VERSION } from "./sqlSchema";
import type { SqlDataset } from "./sqlDataset";

export type SqlMigration = {
  fromVersion: number;
  toVersion: number;
  id: string;
  description: string;
  statements: string[];
};

export type MigrationPlan =
  | { ok: true; currentVersion: number; targetVersion: number; migrations: SqlMigration[] }
  | { ok: false; currentVersion: number | null; targetVersion: number; error: string };

export const SQL_MIGRATIONS: SqlMigration[] = [];

export function schemaVersionFromDataset(dataset: Pick<SqlDataset, "app_metadata">) {
  const row = dataset.app_metadata.find((item) => item.key === "schema_version");
  if (!row) {
    return null;
  }
  const value = Number(row.value);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function planSqlMigrations(
  currentVersion: number | null,
  targetVersion = SQL_SCHEMA_VERSION,
): MigrationPlan {
  if (currentVersion === null) {
    return {
      ok: false,
      currentVersion,
      targetVersion,
      error: "Missing or invalid schema version metadata.",
    };
  }

  if (currentVersion === targetVersion) {
    return {
      ok: true,
      currentVersion,
      targetVersion,
      migrations: [],
    };
  }

  if (currentVersion > targetVersion) {
    return {
      ok: false,
      currentVersion,
      targetVersion,
      error: "Local schema version is newer than this app build supports.",
    };
  }

  const migrations: SqlMigration[] = [];
  let version = currentVersion;
  while (version < targetVersion) {
    const migration = SQL_MIGRATIONS.find((item) => item.fromVersion === version);
    if (!migration) {
      return {
        ok: false,
        currentVersion,
        targetVersion,
        error: `No migration registered from schema version ${version}.`,
      };
    }
    migrations.push(migration);
    version = migration.toVersion;
  }

  return {
    ok: true,
    currentVersion,
    targetVersion,
    migrations,
  };
}

export function applySqlMigrationStatements(plan: Extract<MigrationPlan, { ok: true }>) {
  return plan.migrations.flatMap((migration) => migration.statements);
}
