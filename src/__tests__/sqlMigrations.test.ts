import { describe, expect, it } from "vitest";
import { createSqlDataset } from "../backend/sqlDataset";
import {
  applySqlMigrationStatements,
  planSqlMigrations,
  schemaVersionFromDataset,
  SQL_MIGRATIONS,
} from "../backend/sqlMigrations";
import { SQL_SCHEMA_VERSION } from "../backend/sqlSchema";
import { demoData } from "../data/demoData";

describe("SQL migration planner", () => {
  it("reads schema version from SQL dataset metadata", () => {
    const dataset = createSqlDataset(demoData);

    expect(schemaVersionFromDataset(dataset)).toBe(SQL_SCHEMA_VERSION);
  });

  it("returns a no-op plan for the current schema version", () => {
    const plan = planSqlMigrations(SQL_SCHEMA_VERSION);

    expect(plan).toEqual({
      ok: true,
      currentVersion: SQL_SCHEMA_VERSION,
      targetVersion: SQL_SCHEMA_VERSION,
      migrations: [],
    });
    if (plan.ok) {
      expect(applySqlMigrationStatements(plan)).toEqual([]);
    }
  });

  it("rejects missing or invalid metadata", () => {
    expect(schemaVersionFromDataset({ app_metadata: [] })).toBeNull();
    expect(schemaVersionFromDataset({ app_metadata: [{ key: "schema_version", value: "nope", updated_at: "now" }] })).toBeNull();
    expect(planSqlMigrations(null)).toMatchObject({
      ok: false,
      currentVersion: null,
      error: "Missing or invalid schema version metadata.",
    });
  });

  it("rejects local versions newer than the app supports", () => {
    expect(planSqlMigrations(SQL_SCHEMA_VERSION + 1)).toMatchObject({
      ok: false,
      currentVersion: SQL_SCHEMA_VERSION + 1,
      targetVersion: SQL_SCHEMA_VERSION,
      error: "Local schema version is newer than this app build supports.",
    });
  });

  it("rejects unsupported upgrade paths until migrations are registered", () => {
    expect(SQL_MIGRATIONS).toEqual([]);
    expect(planSqlMigrations(1, 2)).toMatchObject({
      ok: false,
      currentVersion: 1,
      targetVersion: 2,
      error: "No migration registered from schema version 1.",
    });
  });
});
