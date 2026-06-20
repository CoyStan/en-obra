import { describe, expect, it } from "vitest";
import {
  createReleaseHandoffSummary,
  createReleaseHandoffSummaryJson,
} from "../backend/releaseHandoff";

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

const generatedAt = "2026-06-20T12:00:00Z";

function currentSecretTargets() {
  return ["app.json", "package.json", "eas.json"]
    .filter((path) => fs.existsSync(path))
    .map((path) => ({
      path,
      text: fs.readFileSync(path, "utf8"),
    }));
}

function currentInput() {
  return {
    generatedAt,
    releaseConfig: {
      dependencies: packageJson.dependencies ?? {},
      devDependencies: packageJson.devDependencies ?? {},
      androidPermissions: appJson.expo?.android?.permissions ?? [],
    },
    secretScanTargets: currentSecretTargets(),
  };
}

describe("backend release handoff summary", () => {
  it("summarizes current local backend readiness for Play internal testing", () => {
    const summary = createReleaseHandoffSummary(currentInput());

    expect(summary.status).toBe("ready-for-local-internal-testing");
    expect(summary.backendGateStatus).toBe("pass");
    expect(summary.readiness).toEqual({
      localBackendReady: true,
      accessReadyForInternalTesting: true,
      storageReadyForInternalTesting: true,
      retentionReadyForInternalTesting: true,
      playDataSafetyDraftReady: true,
      privacyScanPassed: true,
      secretSafetyScanPassed: true,
    });
    expect(summary.demoOnly).toContain("local mock account/session");
    expect(summary.noGoGuarantees).toContain("no real payments");
    expect(summary.noGoGuarantees).toContain("no committed release secrets");
  });

  it("keeps human access, storage, legal, and Play actions explicit", () => {
    const summary = createReleaseHandoffSummary(currentInput());

    expect(summary.humanBlockers).toContain("production-auth");
    expect(summary.humanBlockers).toContain("production-storage");
    expect(summary.humanBlockers).toContain("remote-deletion");
    expect(summary.humanBlockers).toContain("founder access/provider decision");
    expect(summary.humanBlockers).toContain("founder storage/provider decision");
    expect(summary.nextHumanActions).toContain("Choose production auth/access provider.");
    expect(summary.nextHumanActions).toContain("Complete Play Console Data Safety answers from the technical draft.");
    expect(summary.commands).toContain("npm run release:android:check");
  });

  it("links the release evidence chain", () => {
    const summary = createReleaseHandoffSummary(currentInput());

    expect(summary.evidence).toContain("src/backend/releaseHandoff.ts");
    expect(summary.evidence).toContain("docs/backend/release-handoff-v1.json");
    expect(summary.evidence).toContain("docs/backend/release-manifest-v1.json");
    expect(summary.evidence).toContain("docs/backend/play-preflight-v1.json");
    expect(summary.evidence).toContain("src/backend/playDataSafetyDraft.ts");
    expect(summary.evidence).toContain("src/backend/secretSafetyScan.ts");
  });

  it("blocks the handoff if release risks are detected", () => {
    const summary = createReleaseHandoffSummary({
      generatedAt,
      releaseConfig: {
        dependencies: { "@stripe/stripe-react-native": "1.0.0" },
        devDependencies: {},
        androidPermissions: ["ACCESS_FINE_LOCATION"],
      },
      secretScanTargets: [
        {
          path: "app.json",
          text: '{"extra":{"apiKey":"sk-proj-abcdefghijklmnopqrstuvwxyz123456"}}',
        },
      ],
    });

    expect(summary.status).toBe("blocked");
    expect(summary.readiness.privacyScanPassed).toBe(false);
    expect(summary.readiness.secretSafetyScanPassed).toBe(false);
    expect(summary.readiness.playDataSafetyDraftReady).toBe(false);
  });

  it("keeps the committed release handoff artifact synchronized", () => {
    const committed = fs.readFileSync("docs/backend/release-handoff-v1.json", "utf8");
    const generated = createReleaseHandoffSummaryJson(currentInput());
    const parsed = JSON.parse(committed);

    expect(committed).toBe(generated);
    expect(parsed.status).toBe("ready-for-local-internal-testing");
  });
});

