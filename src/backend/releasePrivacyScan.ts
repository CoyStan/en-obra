export type ReleasePrivacyScanInput = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  androidPermissions: string[];
};

export type ReleasePrivacyRiskKind =
  | "ads-sdk"
  | "analytics-sdk"
  | "payments-sdk"
  | "location-or-contacts-sdk"
  | "android-permission";

export type ReleasePrivacyRisk = {
  kind: ReleasePrivacyRiskKind;
  name: string;
  reason: string;
};

export type ReleasePrivacyScanReport = {
  status: "pass" | "fail";
  packageCount: number;
  androidPermissions: string[];
  risks: ReleasePrivacyRisk[];
  claimsSupported: {
    noAdsSdk: boolean;
    noAnalyticsSdk: boolean;
    noPaymentSdk: boolean;
    noLocationOrContactsSdk: boolean;
    noAndroidPermissions: boolean;
  };
};

const riskyPackagePatterns: { kind: ReleasePrivacyRiskKind; pattern: RegExp; reason: string }[] = [
  { kind: "ads-sdk", pattern: /admob|ads|advertising/i, reason: "Ads SDK would change Play Data Safety answers." },
  {
    kind: "analytics-sdk",
    pattern: /analytics|segment|amplitude|mixpanel|sentry|crashlytics|firebase/i,
    reason: "Analytics/crash SDK would require privacy and Data Safety review.",
  },
  {
    kind: "payments-sdk",
    pattern: /stripe|paypal|mercado.?pago|payment|payments/i,
    reason: "Payment SDK is forbidden for the no-real-payments build.",
  },
  {
    kind: "location-or-contacts-sdk",
    pattern: /location|geolocation|contacts/i,
    reason: "Location/contact SDK would change permissions and Data Safety answers.",
  },
];

export function createReleasePrivacyScan(input: ReleasePrivacyScanInput): ReleasePrivacyScanReport {
  const packages = Object.keys({
    ...input.dependencies,
    ...input.devDependencies,
  }).sort();
  const packageRisks = packages.flatMap((name) =>
    riskyPackagePatterns
      .filter((rule) => rule.pattern.test(name))
      .map((rule) => ({
        kind: rule.kind,
        name,
        reason: rule.reason,
      })),
  );
  const permissionRisks = input.androidPermissions.map((permission) => ({
    kind: "android-permission" as const,
    name: permission,
    reason: "Android permission must be reviewed against Play Data Safety and store listing copy.",
  }));
  const risks = [...packageRisks, ...permissionRisks];

  return {
    status: risks.length === 0 ? "pass" : "fail",
    packageCount: packages.length,
    androidPermissions: [...input.androidPermissions].sort(),
    risks,
    claimsSupported: {
      noAdsSdk: !risks.some((risk) => risk.kind === "ads-sdk"),
      noAnalyticsSdk: !risks.some((risk) => risk.kind === "analytics-sdk"),
      noPaymentSdk: !risks.some((risk) => risk.kind === "payments-sdk"),
      noLocationOrContactsSdk: !risks.some((risk) => risk.kind === "location-or-contacts-sdk"),
      noAndroidPermissions: !risks.some((risk) => risk.kind === "android-permission"),
    },
  };
}
