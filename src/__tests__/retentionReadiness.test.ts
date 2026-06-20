import { describe, expect, it } from "vitest";
import {
  LOCAL_RETENTION_CONFIG,
  createRetentionReadinessReport,
  type RetentionReadinessConfig,
} from "../backend/retentionReadiness";

describe("retention readiness", () => {
  it("marks the local-first demo retention model ready for internal testing", () => {
    const report = createRetentionReadinessReport();

    expect(report.mode).toBe("local-first-demo");
    expect(report.internalTestingStatus).toBe("ready");
    expect(report.productionStatus).toBe("blocked");
    expect(report.localDataRetention).toBe("until-clear-data-uninstall-or-demo-reset");
    expect(report.cloudBackupEnabled).toBe(false);
    expect(report.productionRetentionApproved).toBe(false);
    expect(report.missingInternalTestingCapabilities).toEqual([]);
    expect(report.evidence).toContain("src/security/dataDeletion.ts");
    expect(report.evidence).toContain("src/backend/supportBundle.ts");
  });

  it("keeps production retention, backup, deletion, URL, and legal blockers explicit", () => {
    const report = createRetentionReadinessReport();

    expect(report.blockers).toContain("production-retention-policy");
    expect(report.blockers).toContain("server-side-backups");
    expect(report.blockers).toContain("remote-delete-fulfillment");
    expect(report.blockers).toContain("public-deletion-url");
    expect(report.blockers).toContain("legal-retention-approval");
    expect(report.missingProductionCapabilities).toContain("retention-policy");
    expect(report.missingProductionCapabilities).toContain("server-side-backups");
    expect(report.missingProductionCapabilities).toContain("backup-restore-drill");
  });

  it("blocks internal testing if local retention controls are removed", () => {
    const config: RetentionReadinessConfig = {
      ...LOCAL_RETENTION_CONFIG,
      capabilities: ["local-clear-data", "support-redaction"],
    };
    const report = createRetentionReadinessReport(config);

    expect(report.internalTestingStatus).toBe("blocked");
    expect(report.missingInternalTestingCapabilities).toEqual([
      "local-uninstall-clear",
      "local-export-package",
      "import-validation",
    ]);
  });

  it("can represent a future production-ready provider without selecting a vendor", () => {
    const config: RetentionReadinessConfig = {
      mode: "production-configured",
      capabilities: [
        "local-clear-data",
        "local-uninstall-clear",
        "local-export-package",
        "import-validation",
        "support-redaction",
        "retention-policy",
        "server-side-backups",
        "backup-restore-drill",
        "remote-delete-fulfillment",
        "public-deletion-url",
        "legal-retention-approval",
      ],
      remoteBackupConfigured: true,
      remoteDeletionFulfillmentConfigured: true,
      publicDeletionUrlConfigured: true,
      legalApproved: true,
    };
    const report = createRetentionReadinessReport(config);

    expect(report.internalTestingStatus).toBe("ready");
    expect(report.productionStatus).toBe("ready");
    expect(report.blockers).toEqual([]);
    expect(report.productionRetentionApproved).toBe(true);
    expect(report.cloudBackupEnabled).toBe(true);
  });
});

