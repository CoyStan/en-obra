/**
 * Storage invariant tests.
 * Verifies that:
 * - Corrupt localStorage yields recovery state, not a blank app.
 * - Adding a material always requires a projectId.
 */

import { describe, expect, it } from "vitest";
import { loadFromUnknown } from "../en-obra/envelope";
import { createDemoData } from "../en-obra/demo";
import { createMaterialRecord } from "../en-obra/materials";

describe("corrupt storage → recovery state", () => {
  it("bare TrackerDataV2 (missing envelope) is corrupt", () => {
    const rawV2 = {
      schemaVersion: 2,
      projects: [],
      suppliers: [],
      materials: [],
    };
    const result = loadFromUnknown(rawV2);
    expect(result.kind).toBe("corrupt");
  });

  it("arbitrary string payload is corrupt", () => {
    const result = loadFromUnknown("not-json-at-all");
    expect(result.kind).toBe("corrupt");
  });

  it("null is corrupt", () => {
    const result = loadFromUnknown(null);
    expect(result.kind).toBe("corrupt");
  });

  it("envelope with wrong schemaVersion is corrupt", () => {
    const result = loadFromUnknown({
      datasetKind: "demo",
      schemaVersion: 1,
      data: { schemaVersion: 2, projects: [], suppliers: [], materials: [] },
      writtenAt: new Date().toISOString(),
    });
    expect(result.kind).toBe("corrupt");
  });

  it("valid v2 envelope is accepted", () => {
    const data = createDemoData(new Date("2026-07-21T12:00:00Z"));
    const envelope = {
      datasetKind: "demo",
      schemaVersion: 2,
      data,
      writtenAt: new Date().toISOString(),
    };
    const result = loadFromUnknown(envelope);
    expect(result.kind).toBe("v2");
  });
});

describe("material add requires projectId", () => {
  const NOW = "2026-07-21T12:00:00Z";

  it("creates a material record with the supplied projectId", () => {
    const material = createMaterialRecord(
      { name: "Pintura blanca", quantity: "4 cubetas" },
      "material-1",
      "project-abc",
      NOW,
    );
    expect(material.projectId).toBe("project-abc");
    expect(material.name).toBe("Pintura blanca");
    expect(material.status).toBe("to_order");
  });

  it("trims name and quantity", () => {
    const material = createMaterialRecord(
      { name: "  Tierra negra  ", quantity: "  12 costales  " },
      "material-2",
      "project-xyz",
      NOW,
    );
    expect(material.name).toBe("Tierra negra");
    expect(material.quantity).toBe("12 costales");
  });

  it("empty supplierId is stored as undefined", () => {
    const material = createMaterialRecord(
      { name: "Riego", supplierId: "" },
      "material-3",
      "project-1",
      NOW,
    );
    expect(material.supplierId).toBeUndefined();
  });

  it("demo data has projects with valid ids", () => {
    const demo = createDemoData(new Date("2026-07-21T12:00:00Z"));
    for (const material of demo.materials) {
      const projectExists = demo.projects.some((p) => p.id === material.projectId);
      expect(projectExists).toBe(true);
    }
  });
});
