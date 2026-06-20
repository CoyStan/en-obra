import { describe, expect, it } from "vitest";
import { createBackendReadinessReport } from "../backend/releaseReadiness";

describe("backend release readiness audit", () => {
  it("marks provider-neutral backend capabilities ready", () => {
    const report = createBackendReadinessReport("2026-06-20T12:00:00Z");
    const byId = new Map(report.items.map((item) => [item.id, item]));

    expect(report.releaseTarget).toBe("play-internal-testing");
    expect(byId.get("sql-schema")?.status).toBe("ready");
    expect(byId.get("sql-seed")?.status).toBe("ready");
    expect(byId.get("integrity")?.status).toBe("ready");
    expect(byId.get("mutations")?.status).toBe("ready");
    expect(byId.get("repository")?.status).toBe("ready");
    expect(byId.get("local-storage-adapter")?.status).toBe("ready");
    expect(byId.get("storage-readiness")?.status).toBe("ready");
    expect(byId.get("outbox")?.status).toBe("ready");
    expect(byId.get("sync-engine")?.status).toBe("ready");
    expect(byId.get("conflict-policy")?.status).toBe("ready");
    expect(byId.get("release-manifest")?.status).toBe("ready");
    expect(byId.get("import-restore")?.status).toBe("ready");
    expect(byId.get("diagnostics")?.status).toBe("ready");
    expect(byId.get("deletion-workflow")?.status).toBe("ready");
    expect(byId.get("retention-readiness")?.status).toBe("ready");
    expect(byId.get("access-readiness")?.status).toBe("ready");
    expect(byId.get("data-safety-inventory")?.status).toBe("ready");
    expect(byId.get("play-data-safety-draft")?.status).toBe("ready");
    expect(byId.get("release-handoff")?.status).toBe("ready");
    expect(byId.get("release-privacy-scan")?.status).toBe("ready");
    expect(byId.get("secret-safety-scan")?.status).toBe("ready");
    expect(byId.get("support-bundle")?.status).toBe("ready");
    expect(byId.get("export")?.status).toBe("ready");
    expect(byId.get("migrations")?.status).toBe("ready");
    expect(report.readinessPercent).toBeGreaterThanOrEqual(70);
  });

  it("keeps production access/storage/legal blockers explicit", () => {
    const report = createBackendReadinessReport("2026-06-20T12:00:00Z");

    expect(report.blockers.map((item) => item.id)).toEqual([
      "production-auth",
      "production-storage",
      "remote-deletion",
    ]);
    expect(report.blockers.map((item) => item.blocker).join(" ")).toContain("founder decision");
    expect(report.blockers.map((item) => item.blocker).join(" ")).toContain("legal/security approval");
  });
});
