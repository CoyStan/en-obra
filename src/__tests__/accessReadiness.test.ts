import { describe, expect, it } from "vitest";
import {
  LOCAL_MOCK_ACCESS_CONFIG,
  createAccessReadinessReport,
  type AccessProviderReadinessConfig,
} from "../backend/accessReadiness";

describe("access readiness", () => {
  it("allows the local mock account model for internal testing", () => {
    const report = createAccessReadinessReport();

    expect(report.providerId).toBe("local-mock");
    expect(report.mode).toBe("local-mock");
    expect(report.internalTestingStatus).toBe("ready");
    expect(report.missingInternalTestingCapabilities).toEqual([]);
    expect(report.productionStatus).toBe("blocked");
    expect(report.providerSelectedForProduction).toBe(false);
    expect(report.evidence).toContain("src/auth/localAccountAdapter.ts");
  });

  it("keeps production auth blocked until provider and deletion requirements exist", () => {
    const report = createAccessReadinessReport();

    expect(report.blockers).toContain("production-auth-provider");
    expect(report.blockers).toContain("production-auth-secrets");
    expect(report.blockers).toContain("remote-deletion-endpoint");
    expect(report.blockers).toContain("public-privacy-policy-url");
    expect(report.missingProductionCapabilities).toEqual([
      "verified-session",
      "account-deletion-request",
      "remote-deletion-status",
      "privacy-policy-url",
    ]);
  });

  it("marks a fully configured future provider ready without naming a vendor", () => {
    const productionConfig: AccessProviderReadinessConfig = {
      ...LOCAL_MOCK_ACCESS_CONFIG,
      providerId: "future-production-provider",
      mode: "production-configured",
      capabilities: [
        ...LOCAL_MOCK_ACCESS_CONFIG.capabilities,
        "verified-session",
        "account-deletion-request",
        "remote-deletion-status",
        "privacy-policy-url",
      ],
      secretsConfigured: true,
      remoteDeletionEndpointConfigured: true,
      publicPrivacyUrlConfigured: true,
    };

    const report = createAccessReadinessReport(productionConfig);

    expect(report.internalTestingStatus).toBe("ready");
    expect(report.productionStatus).toBe("ready");
    expect(report.providerSelectedForProduction).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.missingProductionCapabilities).toEqual([]);
  });

  it("blocks internal testing if a candidate provider loses local identity basics", () => {
    const report = createAccessReadinessReport({
      ...LOCAL_MOCK_ACCESS_CONFIG,
      capabilities: ["stable-user-id", "session-restore"],
      mode: "provider-candidate",
      providerId: "candidate",
    });

    expect(report.internalTestingStatus).toBe("blocked");
    expect(report.missingInternalTestingCapabilities).toEqual([
      "sign-out",
      "group-identity-mapping",
      "offline-guest-mode",
      "local-data-export",
    ]);
  });
});
