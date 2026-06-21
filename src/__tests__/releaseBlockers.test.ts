import { describe, expect, it } from "vitest";
import { classifyReleaseBlockers } from "../backend/releaseBlockers";

describe("release blocker classification", () => {
  it("groups known human and provider blockers by owner/category", () => {
    const report = classifyReleaseBlockers([
      "production-auth",
      "production-storage",
      "remote-deletion",
      "Play Console account and signing credentials",
      "signed Android App Bundle upload",
      "human legal/privacy approval",
      "final Play Console Data Safety answers",
      "server-side-backups",
      "production-auth-secrets",
    ]);
    const byId = new Map(report.blockers.map((blocker) => [blocker.id, blocker]));

    expect(byId.get("production-auth")?.category).toBe("founder-access-decision");
    expect(byId.get("production-storage")?.category).toBe("founder-storage-decision");
    expect(byId.get("remote-deletion")?.category).toBe("remote-deletion");
    expect(byId.get("human legal/privacy approval")?.category).toBe("legal-privacy");
    expect(byId.get("final Play Console Data Safety answers")?.category).toBe("legal-privacy");
    expect(byId.get("signed Android App Bundle upload")?.category).toBe("build-signing");
    expect(byId.get("server-side-backups")?.category).toBe("storage-operations");
    expect(byId.get("production-auth-secrets")?.category).toBe("founder-access-decision");
    expect(report.hasUnknownBlockers).toBe(false);
  });

  it("marks blockers that prevent internal testing upload separately from backend production blockers", () => {
    const report = classifyReleaseBlockers([
      "production-auth",
      "signed Android App Bundle upload",
      "public privacy policy URL",
      "server-side-backups",
    ]);
    const byId = new Map(report.blockers.map((blocker) => [blocker.id, blocker]));

    expect(byId.get("production-auth")?.blocksInternalTestingUpload).toBe(false);
    expect(byId.get("production-auth")?.blocksProductionBackend).toBe(true);
    expect(byId.get("signed Android App Bundle upload")?.blocksInternalTestingUpload).toBe(true);
    expect(byId.get("signed Android App Bundle upload")?.blocksProductionBackend).toBe(false);
    expect(byId.get("public privacy policy URL")?.blocksInternalTestingUpload).toBe(true);
    expect(byId.get("server-side-backups")?.blocksProductionBackend).toBe(true);
  });

  it("deduplicates and flags unknown blockers conservatively", () => {
    const report = classifyReleaseBlockers(["mystery-blocker", "mystery-blocker"]);

    expect(report.blockers).toHaveLength(1);
    expect(report.unknownBlockers).toEqual(["mystery-blocker"]);
    expect(report.hasUnknownBlockers).toBe(true);
    expect(report.blockers[0]).toMatchObject({
      category: "unknown",
      owner: "unknown",
      blocksInternalTestingUpload: true,
      blocksProductionBackend: true,
    });
  });
});

