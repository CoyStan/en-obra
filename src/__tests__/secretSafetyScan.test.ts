import { describe, expect, it } from "vitest";
import { createSecretSafetyScan } from "../backend/secretSafetyScan";

declare const require: (moduleName: string) => {
  existsSync?: (path: string) => boolean;
  readFileSync?: (path: string, encoding: "utf8") => string;
};

const fs = require("fs");

function currentReleaseTargets() {
  return ["app.json", "package.json", "eas.json"]
    .filter((path) => fs.existsSync?.(path))
    .map((path) => ({
      path,
      text: fs.readFileSync?.(path, "utf8") ?? "",
    }));
}

describe("secret safety scan", () => {
  it("passes for current release-facing config files", () => {
    const report = createSecretSafetyScan(currentReleaseTargets());

    expect(report.status).toBe("pass");
    expect(report.risks).toEqual([]);
    expect(report.scannedPaths).toEqual(["app.json", "eas.json", "package.json"]);
    expect(report.claimsSupported).toEqual({
      noApiKeys: true,
      noPaymentKeys: true,
      noPlayServiceAccount: true,
      noPrivateKeys: true,
      noProductionBackendUrl: true,
    });
  });

  it("fails on API keys, payment keys, Play credentials, private keys, and backend URLs", () => {
    const report = createSecretSafetyScan([
      {
        path: "app.json",
        text: JSON.stringify({
          extra: {
            openRouterKey: "sk-or-v1-abcdefghijklmnopqrstuvwxyz1234567890",
            stripeKey: "sk_live_abcdefghijklmnopqrstuvwxyz",
            apiUrl: "https://api.cuentasclaras.mx/v1",
          },
        }),
      },
      {
        path: "play-service-account.json",
        text: JSON.stringify({
          type: "service_account",
          private_key_id: "abc123",
        }),
      },
      {
        path: "private.pem",
        text: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
      },
    ]);

    expect(report.status).toBe("fail");
    expect(report.claimsSupported.noApiKeys).toBe(false);
    expect(report.claimsSupported.noPaymentKeys).toBe(false);
    expect(report.claimsSupported.noPlayServiceAccount).toBe(false);
    expect(report.claimsSupported.noPrivateKeys).toBe(false);
    expect(report.claimsSupported.noProductionBackendUrl).toBe(false);
    expect(report.risks.map((risk) => risk.kind)).toEqual([
      "api-key",
      "payment-key",
      "production-backend-url",
      "play-service-account",
      "play-service-account",
      "private-key",
    ]);
  });

  it("allows obvious placeholders in documentation snippets", () => {
    const report = createSecretSafetyScan([
      {
        path: "docs/example.md",
        text: 'Use apiKey: "YOUR_API_KEY_PLACEHOLDER" only in local docs.',
      },
    ]);

    expect(report.status).toBe("pass");
  });
});

