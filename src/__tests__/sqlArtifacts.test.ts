import { describe, expect, it } from "vitest";
import { createSqlSnapshot } from "../backend/sqlDataset";
import { demoData } from "../data/demoData";

declare const require: (moduleName: string) => { readFileSync: (path: string, encoding: "utf8") => string };

const { readFileSync } = require("fs");

function readArtifact(path: string) {
  return readFileSync(path, "utf8").trimEnd();
}

describe("committed SQL artifacts", () => {
  it("keeps schema-v1.sql synchronized with the SQL schema generator", () => {
    const snapshot = createSqlSnapshot(demoData);

    expect(readArtifact("docs/backend/schema-v1.sql")).toBe(snapshot.schemaSql);
  });

  it("keeps seed-demo-v1.sql synchronized with the demo SQL dataset generator", () => {
    const snapshot = createSqlSnapshot(demoData);
    const seed = readArtifact("docs/backend/seed-demo-v1.sql");

    expect(seed).toBe(snapshot.seedSql);
    expect(seed).toContain("INSERT INTO users");
    expect(seed).toContain("INSERT INTO expense_participants");
    expect(seed).toContain("INSERT INTO activity_events");
    expect(seed).not.toContain("INSERT INTO sync_outbox");
  });
});
