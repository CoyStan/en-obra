import { describe, expect, it } from "vitest";
import {
  LOCAL_ASYNC_STORAGE_CONFIG,
  createStorageReadinessReport,
  type StorageProviderReadinessConfig,
} from "../backend/storageReadiness";

describe("storage readiness", () => {
  it("allows local AsyncStorage for internal testing", () => {
    const report = createStorageReadinessReport();

    expect(report.providerId).toBe("local-async-storage");
    expect(report.mode).toBe("local-async-storage");
    expect(report.internalTestingStatus).toBe("ready");
    expect(report.missingInternalTestingCapabilities).toEqual([]);
    expect(report.productionStatus).toBe("blocked");
    expect(report.providerSelectedForProduction).toBe(false);
    expect(report.evidence).toContain("src/backend/asyncStorageRepository.ts");
  });

  it("keeps production storage blocked until provider and operations decisions exist", () => {
    const report = createStorageReadinessReport();

    expect(report.blockers).toContain("production-storage-provider");
    expect(report.blockers).toContain("production-storage-secrets");
    expect(report.blockers).toContain("production-storage-endpoint");
    expect(report.blockers).toContain("regional-data-decision");
    expect(report.blockers).toContain("remote-deletion-fulfillment");
    expect(report.missingProductionCapabilities).toEqual([
      "remote-persistence",
      "server-side-backups",
      "regional-data-decision",
      "remote-delete-fulfillment",
      "security-review",
    ]);
  });

  it("marks a fully configured future storage provider ready without choosing one now", () => {
    const productionConfig: StorageProviderReadinessConfig = {
      ...LOCAL_ASYNC_STORAGE_CONFIG,
      providerId: "future-production-storage",
      mode: "production-configured",
      capabilities: [
        ...LOCAL_ASYNC_STORAGE_CONFIG.capabilities,
        "remote-persistence",
        "server-side-backups",
        "regional-data-decision",
        "remote-delete-fulfillment",
        "security-review",
      ],
      secretsConfigured: true,
      productionEndpointConfigured: true,
      dataRegionSelected: true,
      remoteDeletionFulfillmentConfigured: true,
    };

    const report = createStorageReadinessReport(productionConfig);

    expect(report.internalTestingStatus).toBe("ready");
    expect(report.productionStatus).toBe("ready");
    expect(report.providerSelectedForProduction).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.missingProductionCapabilities).toEqual([]);
  });

  it("blocks internal testing if a candidate loses offline safety basics", () => {
    const report = createStorageReadinessReport({
      ...LOCAL_ASYNC_STORAGE_CONFIG,
      capabilities: ["durable-local-cache", "schema-versioning"],
      mode: "provider-candidate",
      providerId: "candidate",
    });

    expect(report.internalTestingStatus).toBe("blocked");
    expect(report.missingInternalTestingCapabilities).toEqual([
      "integrity-repair",
      "offline-mutation-queue",
      "export-package",
      "import-validation",
      "delete-local-data",
      "conflict-policy",
    ]);
  });
});
