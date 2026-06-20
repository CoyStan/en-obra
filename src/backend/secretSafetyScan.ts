export type SecretSafetyRiskKind =
  | "api-key"
  | "payment-key"
  | "play-service-account"
  | "private-key"
  | "production-backend-url";

export type SecretSafetyTarget = {
  path: string;
  text: string;
};

export type SecretSafetyRisk = {
  kind: SecretSafetyRiskKind;
  path: string;
  match: string;
  reason: string;
};

export type SecretSafetyScanReport = {
  status: "pass" | "fail";
  scannedPaths: string[];
  risks: SecretSafetyRisk[];
  claimsSupported: {
    noApiKeys: boolean;
    noPaymentKeys: boolean;
    noPlayServiceAccount: boolean;
    noPrivateKeys: boolean;
    noProductionBackendUrl: boolean;
  };
};

const secretPatterns: {
  kind: SecretSafetyRiskKind;
  pattern: RegExp;
  reason: string;
}[] = [
  {
    kind: "api-key",
    pattern: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}|sk-or-v1-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}/g,
    reason: "API key literal must not be committed into the mobile release bundle.",
  },
  {
    kind: "api-key",
    pattern: /(?:api[_-]?key|client[_-]?secret|secret|token)\s*[:=]\s*["'][^"']{16,}["']/gi,
    reason: "Secret-looking assignment must be replaced with a runtime secret boundary.",
  },
  {
    kind: "payment-key",
    pattern: /(?:sk|pk)_(?:live|test)_[0-9A-Za-z]{16,}|APP_USR-[0-9A-Za-z-]{20,}/g,
    reason: "Payment key is forbidden for the no-real-payments build.",
  },
  {
    kind: "play-service-account",
    pattern: /"type"\s*:\s*"service_account"|"private_key_id"\s*:/g,
    reason: "Google service-account credentials must stay outside the repo and app bundle.",
  },
  {
    kind: "private-key",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
    reason: "Private keys must never be committed into release-facing files.",
  },
  {
    kind: "production-backend-url",
    pattern: /https:\/\/(?:api|backend)\.[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s"'`)]*)?/gi,
    reason: "Production backend endpoint must not appear before the storage/provider decision is made.",
  },
];

function sanitizeMatch(value: string) {
  return value.length > 28 ? `${value.slice(0, 12)}...${value.slice(-6)}` : value;
}

function isPlaceholder(value: string) {
  return /example|placeholder|changeme|demo|local|undefined|your[_-]?|<|>/i.test(value);
}

export function createSecretSafetyScan(targets: SecretSafetyTarget[]): SecretSafetyScanReport {
  const risks = targets.flatMap((target) =>
    secretPatterns.flatMap((rule) =>
      Array.from(target.text.matchAll(rule.pattern))
        .map((match) => match[0])
        .filter((value) => !isPlaceholder(value))
        .map((value) => ({
          kind: rule.kind,
          path: target.path,
          match: sanitizeMatch(value),
          reason: rule.reason,
        })),
    ),
  );

  return {
    status: risks.length === 0 ? "pass" : "fail",
    scannedPaths: targets.map((target) => target.path).sort(),
    risks,
    claimsSupported: {
      noApiKeys: !risks.some((risk) => risk.kind === "api-key"),
      noPaymentKeys: !risks.some((risk) => risk.kind === "payment-key"),
      noPlayServiceAccount: !risks.some((risk) => risk.kind === "play-service-account"),
      noPrivateKeys: !risks.some((risk) => risk.kind === "private-key"),
      noProductionBackendUrl: !risks.some((risk) => risk.kind === "production-backend-url"),
    },
  };
}

