import { describe, expect, it } from "vitest";
import { createPlayPreflightReport } from "../backend/playPreflight";

describe("Play preflight report", () => {
  it("aggregates backend readiness into an internal-testing preflight report", () => {
    const report = createPlayPreflightReport("2026-06-20T12:00:00Z");

    expect(report.target).toBe("play-internal-testing");
    expect(report.status).toBe("ready-for-internal-testing");
    expect(report.backendGateStatus).toBe("pass");
    expect(report.localBackendReady).toBe(true);
    expect(report.realPaymentsEnabled).toBe(false);
    expect(report.remoteBackendEnabled).toBe(false);
    expect(report.readySignals).toContain("backend release gate passes");
    expect(report.readySignals).toContain("Data Safety technical inventory is local-first");
  });

  it("keeps human and provider blockers visible", () => {
    const report = createPlayPreflightReport("2026-06-20T12:00:00Z");

    expect(report.humanBlockers).toContain("production-auth");
    expect(report.humanBlockers).toContain("production-storage");
    expect(report.humanBlockers).toContain("remote-deletion");
    expect(report.humanBlockers).toContain("Play Console account and signing credentials");
    expect(report.humanBlockers).toContain("signed Android App Bundle upload");
    expect(report.humanBlockers).toContain("final Play Console Data Safety answers");
  });

  it("links to release evidence for auditability", () => {
    const report = createPlayPreflightReport("2026-06-20T12:00:00Z");

    expect(report.evidence).toContain("src/backend/playPreflight.ts");
    expect(report.evidence).toContain("src/__tests__/playPreflight.test.ts");
    expect(report.evidence).toContain("docs/backend/release-manifest-v1.json");
    expect(report.evidence).toContain("src/backend/accessReadiness.ts");
    expect(report.evidence).toContain("src/backend/storageReadiness.ts");
    expect(report.evidence).toContain("src/backend/dataSafetyInventory.ts");
  });
});
