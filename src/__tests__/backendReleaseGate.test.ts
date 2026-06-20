import { describe, expect, it } from "vitest";
import {
  ALLOWED_PRE_RELEASE_BLOCKERS,
  REQUIRED_BACKEND_CAPABILITIES,
  assertBackendReleaseGate,
  createBackendReleaseGateReport,
} from "../backend/backendReleaseGate";
import type { BackendReadinessReport } from "../backend/releaseReadiness";

describe("backend release gate", () => {
  it("passes when all provider-neutral backend capabilities are ready and only known blockers remain", () => {
    const report = createBackendReleaseGateReport("2026-06-20T12:00:00Z");

    expect(report.status).toBe("pass");
    expect(report.releaseTarget).toBe("play-internal-testing");
    expect(report.missingCapabilities).toEqual([]);
    expect(report.unexpectedBlockers).toEqual([]);
    expect(report.readyCapabilities).toEqual([...REQUIRED_BACKEND_CAPABILITIES].sort());
    expect(report.knownBlockers).toEqual([...ALLOWED_PRE_RELEASE_BLOCKERS].sort());
    expect(report.evidence).toContain("src/backend/asyncStorageRepository.ts");
    expect(report.evidence).toContain("src/backend/storageReadiness.ts");
    expect(report.evidence).toContain("src/backend/syncEngine.ts");
    expect(report.evidence).toContain("src/backend/accessReadiness.ts");
    expect(report.evidence).toContain("src/backend/retentionReadiness.ts");
    expect(report.evidence).toContain("src/backend/dataSafetyInventory.ts");
    expect(report.evidence).toContain("src/backend/releasePrivacyScan.ts");
    expect(report.evidence).toContain("src/backend/secretSafetyScan.ts");
    expect(report.evidence).toContain("src/backend/supportBundle.ts");
    expect(report.evidence).toContain("docs/backend/seed-demo-v1.sql");
    expect(() => assertBackendReleaseGate(report)).not.toThrow();
  });

  it("fails when a required provider-neutral capability is not ready", () => {
    const readiness = createReadinessFixture({
      readyIds: REQUIRED_BACKEND_CAPABILITIES.filter((id) => id !== "sync-engine"),
      blockerIds: ["production-auth", "production-storage", "remote-deletion", "sync-engine"],
    });
    const report = createBackendReleaseGateReport("2026-06-20T12:00:00Z", readiness);

    expect(report.status).toBe("fail");
    expect(report.missingCapabilities).toEqual(["sync-engine"]);
    expect(report.unexpectedBlockers).toEqual(["sync-engine"]);
    expect(() => assertBackendReleaseGate(report)).toThrow(/sync-engine/);
  });

  it("fails when an unexpected blocker is present even if required capabilities are ready", () => {
    const readiness = createReadinessFixture({
      readyIds: REQUIRED_BACKEND_CAPABILITIES,
      blockerIds: ["production-auth", "production-storage", "remote-deletion", "sql-artifact-drift"],
    });
    const report = createBackendReleaseGateReport("2026-06-20T12:00:00Z", readiness);

    expect(report.status).toBe("fail");
    expect(report.missingCapabilities).toEqual([]);
    expect(report.unexpectedBlockers).toEqual(["sql-artifact-drift"]);
    expect(() => assertBackendReleaseGate(report)).toThrow(/sql-artifact-drift/);
  });
});

function createReadinessFixture(input: {
  readyIds: readonly string[];
  blockerIds: string[];
}): BackendReadinessReport {
  const readyItems = input.readyIds.map((id) => ({
    id,
    label: id,
    status: "ready" as const,
    evidence: [`evidence:${id}`],
  }));
  const blockerItems = input.blockerIds.map((id) => ({
    id,
    label: id,
    status: "blocked" as const,
    evidence: [`evidence:${id}`],
    blocker: `blocked:${id}`,
  }));
  const items = [...readyItems, ...blockerItems];

  return {
    generatedAt: "2026-06-20T12:00:00Z",
    releaseTarget: "play-internal-testing",
    readinessPercent: Math.round((readyItems.length / items.length) * 100),
    items,
    blockers: blockerItems,
  };
}
