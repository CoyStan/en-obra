import type { BackendReadinessItem, BackendReadinessReport } from "./releaseReadiness";
import { createBackendReadinessReport } from "./releaseReadiness";

export type BackendReleaseGateStatus = "pass" | "fail";

export type BackendReleaseGateReport = {
  generatedAt: string;
  releaseTarget: BackendReadinessReport["releaseTarget"];
  status: BackendReleaseGateStatus;
  readinessPercent: number;
  readyCapabilities: string[];
  missingCapabilities: string[];
  knownBlockers: string[];
  unexpectedBlockers: string[];
  evidence: string[];
};

export const REQUIRED_BACKEND_CAPABILITIES = [
  "sql-schema",
  "sql-seed",
  "integrity",
  "mutations",
  "repository",
  "local-storage-adapter",
  "outbox",
  "sync-engine",
  "conflict-policy",
  "release-manifest",
  "import-restore",
  "diagnostics",
  "deletion-workflow",
  "access-readiness",
  "export",
  "migrations",
] as const;

export const ALLOWED_PRE_RELEASE_BLOCKERS = [
  "production-auth",
  "production-storage",
  "remote-deletion",
] as const;

function ids(items: BackendReadinessItem[], status?: BackendReadinessItem["status"]) {
  return items
    .filter((item) => !status || item.status === status)
    .map((item) => item.id)
    .sort();
}

function evidenceFor(items: BackendReadinessItem[]) {
  return Array.from(new Set(items.flatMap((item) => item.evidence))).sort();
}

export function createBackendReleaseGateReport(
  generatedAt: string,
  readiness: BackendReadinessReport = createBackendReadinessReport(generatedAt),
): BackendReleaseGateReport {
  const ready = new Set(ids(readiness.items, "ready"));
  const required = new Set<string>(REQUIRED_BACKEND_CAPABILITIES);
  const allowedBlockers = new Set<string>(ALLOWED_PRE_RELEASE_BLOCKERS);
  const blockerIds = ids(readiness.blockers);
  const missingCapabilities = [...required].filter((id) => !ready.has(id)).sort();
  const unexpectedBlockers = blockerIds.filter((id) => !allowedBlockers.has(id)).sort();
  const knownBlockers = blockerIds.filter((id) => allowedBlockers.has(id)).sort();
  const status = missingCapabilities.length === 0 && unexpectedBlockers.length === 0 ? "pass" : "fail";

  return {
    generatedAt,
    releaseTarget: readiness.releaseTarget,
    status,
    readinessPercent: readiness.readinessPercent,
    readyCapabilities: [...ready].filter((id) => required.has(id)).sort(),
    missingCapabilities,
    knownBlockers,
    unexpectedBlockers,
    evidence: evidenceFor(readiness.items),
  };
}

export function assertBackendReleaseGate(report: BackendReleaseGateReport) {
  if (report.status === "pass") {
    return;
  }

  const reasons = [
    report.missingCapabilities.length
      ? `missing capabilities: ${report.missingCapabilities.join(", ")}`
      : "",
    report.unexpectedBlockers.length
      ? `unexpected blockers: ${report.unexpectedBlockers.join(", ")}`
      : "",
  ].filter(Boolean);

  throw new Error(`Backend release gate failed: ${reasons.join("; ")}`);
}
