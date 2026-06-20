import { describe, expect, it } from "vitest";
import { createReleasePrivacyScan } from "../backend/releasePrivacyScan";

declare const require: (moduleName: string) => unknown;

const packageJson = require("../../package.json") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const appJson = require("../../app.json") as {
  expo?: {
    android?: {
      permissions?: string[];
    };
  };
};

describe("release privacy scan", () => {
  it("passes for the current no-ads no-analytics no-payments build", () => {
    const report = createReleasePrivacyScan({
      dependencies: packageJson.dependencies ?? {},
      devDependencies: packageJson.devDependencies ?? {},
      androidPermissions: appJson.expo?.android?.permissions ?? [],
    });

    expect(report.status).toBe("pass");
    expect(report.risks).toEqual([]);
    expect(report.claimsSupported).toEqual({
      noAdsSdk: true,
      noAnalyticsSdk: true,
      noPaymentSdk: true,
      noLocationOrContactsSdk: true,
      noAndroidPermissions: true,
    });
    expect(report.packageCount).toBeGreaterThan(0);
  });

  it("fails if risky SDK or permission signals are introduced", () => {
    const report = createReleasePrivacyScan({
      dependencies: {
        "@stripe/stripe-react-native": "1.0.0",
        "expo-location": "1.0.0",
        "react-native-google-mobile-ads": "1.0.0",
      },
      devDependencies: {
        "@sentry/react-native": "1.0.0",
      },
      androidPermissions: ["ACCESS_FINE_LOCATION"],
    });

    expect(report.status).toBe("fail");
    expect(report.claimsSupported.noAdsSdk).toBe(false);
    expect(report.claimsSupported.noAnalyticsSdk).toBe(false);
    expect(report.claimsSupported.noPaymentSdk).toBe(false);
    expect(report.claimsSupported.noLocationOrContactsSdk).toBe(false);
    expect(report.claimsSupported.noAndroidPermissions).toBe(false);
    expect(report.risks.map((risk) => risk.kind)).toEqual([
      "analytics-sdk",
      "payments-sdk",
      "location-or-contacts-sdk",
      "ads-sdk",
      "android-permission",
    ]);
  });
});
