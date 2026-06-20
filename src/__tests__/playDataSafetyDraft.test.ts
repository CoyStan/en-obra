import { describe, expect, it } from "vitest";
import { createPlayDataSafetyDraft } from "../backend/playDataSafetyDraft";
import { createReleasePrivacyScan } from "../backend/releasePrivacyScan";
import { createSecretSafetyScan } from "../backend/secretSafetyScan";

declare const require: (moduleName: string) => unknown;

const fs = require("fs") as {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: "utf8") => string;
};
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

function currentSecretTargets() {
  return ["app.json", "package.json", "eas.json"]
    .filter((path) => fs.existsSync(path))
    .map((path) => ({
      path,
      text: fs.readFileSync(path, "utf8"),
    }));
}

function currentDraft() {
  return createPlayDataSafetyDraft({
    generatedAt: "2026-06-20T12:00:00Z",
    privacyScan: createReleasePrivacyScan({
      dependencies: packageJson.dependencies ?? {},
      devDependencies: packageJson.devDependencies ?? {},
      androidPermissions: appJson.expo?.android?.permissions ?? [],
    }),
    secretSafety: createSecretSafetyScan(currentSecretTargets()),
  });
}

describe("Play Data Safety technical draft", () => {
  it("creates a non-legal technical draft for the current local-first build", () => {
    const draft = currentDraft();

    expect(draft.status).toBe("technical-draft");
    expect(draft.legalSubmissionReady).toBe(false);
    expect(draft.summary.dataTransmittedToCuentasClarasServers).toBe(false);
    expect(draft.summary.dataSharedWithThirdParties).toBe(false);
    expect(draft.summary.realPaymentsEnabled).toBe(false);
    expect(draft.summary.adsEnabled).toBe(false);
    expect(draft.summary.analyticsEnabled).toBe(false);
    expect(draft.releaseRisks).toEqual([]);
  });

  it("maps current inventory categories into suggested Play declarations", () => {
    const byCategory = new Map(currentDraft().declarations.map((item) => [item.category, item]));

    expect(byCategory.get("account-info")?.suggestedAnswer).toBe("collected-local-only");
    expect(byCategory.get("financial-info")?.suggestedAnswer).toBe("collected-local-only");
    expect(byCategory.get("app-activity")?.suggestedAnswer).toBe("collected-local-only");
    expect(byCategory.get("diagnostics")?.suggestedAnswer).toBe("collected-local-only");
    expect(byCategory.get("contacts")?.suggestedAnswer).toBe("not-collected");
    expect(byCategory.get("payments")?.suggestedAnswer).toBe("not-collected");
    expect(byCategory.get("location")?.suggestedAnswer).toBe("not-collected");
    expect(byCategory.get("advertising")?.suggestedAnswer).toBe("not-collected");
    expect([...byCategory.values()].every((item) => item.transmittedOffDevice === false)).toBe(true);
  });

  it("keeps final Play submission blocked for human/legal review", () => {
    const draft = currentDraft();

    expect(draft.humanBlockers).toContain("human legal/privacy approval");
    expect(draft.humanBlockers).toContain("public privacy policy URL");
    expect(draft.humanBlockers).toContain("final Play Console Data Safety answers");
    expect(draft.humanBlockers).toContain("human review of Play Console wording");
    expect(draft.evidence).toContain("src/backend/playDataSafetyDraft.ts");
    expect(draft.evidence).toContain("src/backend/secretSafetyScan.ts");
  });

  it("blocks the draft when privacy or secret scans detect release risks", () => {
    const draft = createPlayDataSafetyDraft({
      generatedAt: "2026-06-20T12:00:00Z",
      privacyScan: createReleasePrivacyScan({
        dependencies: { "@stripe/stripe-react-native": "1.0.0" },
        devDependencies: {},
        androidPermissions: ["ACCESS_FINE_LOCATION"],
      }),
      secretSafety: createSecretSafetyScan([
        {
          path: "app.json",
          text: '{"extra":{"apiKey":"sk-proj-abcdefghijklmnopqrstuvwxyz123456"}}',
        },
      ]),
    });

    expect(draft.status).toBe("blocked-by-release-risk");
    expect(draft.releaseRisks).toEqual([
      "payments-sdk:@stripe/stripe-react-native",
      "android-permission:ACCESS_FINE_LOCATION",
      "api-key:app.json",
    ]);
  });
});

