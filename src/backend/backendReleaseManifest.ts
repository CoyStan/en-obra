import { demoData } from "../data/demoData";
import { stablePayloadJson } from "./syncOutbox";
import { deterministicChecksum } from "./dataExport";
import { createSqlSnapshot } from "./sqlDataset";
import {
  REQUIRED_BACKEND_CAPABILITIES,
  createBackendReleaseGateReport,
  type BackendReleaseGateReport,
} from "./backendReleaseGate";

export type BackendReleaseManifest = {
  version: 1;
  generatedAt: string;
  app: "Cuentas Claras";
  target: "play-internal-testing";
  backendMode: "local-first-provider-neutral";
  realPaymentsEnabled: false;
  schemaVersion: number;
  tableNames: string[];
  checksums: {
    schemaSql: string;
    seedSql: string;
    gate: string;
    manifestBody: string;
  };
  requiredCapabilities: string[];
  readyCapabilities: string[];
  knownBlockers: string[];
  unexpectedBlockers: string[];
  commands: string[];
};

export function createBackendReleaseManifest(
  generatedAt: string,
  gate: BackendReleaseGateReport = createBackendReleaseGateReport(generatedAt),
): BackendReleaseManifest {
  const sql = createSqlSnapshot(demoData);
  const body = {
    version: 1 as const,
    generatedAt,
    app: "Cuentas Claras" as const,
    target: "play-internal-testing" as const,
    backendMode: "local-first-provider-neutral" as const,
    realPaymentsEnabled: false as const,
    schemaVersion: sql.schemaVersion,
    tableNames: sql.tableNames,
    checksums: {
      schemaSql: deterministicChecksum(sql.schemaSql),
      seedSql: deterministicChecksum(sql.seedSql),
      gate: deterministicChecksum(stablePayloadJson(gate)),
    },
    requiredCapabilities: [...REQUIRED_BACKEND_CAPABILITIES],
    readyCapabilities: gate.readyCapabilities,
    knownBlockers: gate.knownBlockers,
    unexpectedBlockers: gate.unexpectedBlockers,
    commands: [
      "npm run release:backend:gate",
      "npm run release:android:check",
      "./bin/company-os validate",
    ],
  };

  return {
    ...body,
    checksums: {
      ...body.checksums,
      manifestBody: deterministicChecksum(stablePayloadJson(body)),
    },
  };
}

export function verifyBackendReleaseManifest(manifest: BackendReleaseManifest) {
  const { checksums, ...body } = manifest;
  return deterministicChecksum(stablePayloadJson({ ...body, checksums: {
    gate: checksums.gate,
    schemaSql: checksums.schemaSql,
    seedSql: checksums.seedSql,
  } })) === checksums.manifestBody;
}
