import type { AccountState } from "../auth/types";
import type { AppData } from "../domain/types";
import { getLocalDataInventory, getRemoteDeletionStatus } from "../security/dataDeletion";
import type { SyncState } from "../sync/types";
import { createSqlSnapshot } from "./sqlDataset";
import { stablePayloadJson } from "./syncOutbox";

export type LocalDataExportPackage = {
  version: 1;
  mode: "local-only";
  generatedAt: string;
  app: {
    name: "Cuentas Claras";
    defaultCurrency: "MXN";
    realPaymentsEnabled: false;
  };
  inventory: ReturnType<typeof getLocalDataInventory>;
  remoteDeletion: ReturnType<typeof getRemoteDeletionStatus>;
  account: AccountState;
  sync: SyncState;
  data: AppData;
  sql: {
    schemaVersion: number;
    tableNames: string[];
    schemaSql: string;
    seedSql: string;
  };
  checksum: string;
};

function checksum(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createLocalDataExportPackage({
  account,
  data,
  generatedAt,
  sync,
}: {
  account: AccountState;
  data: AppData;
  generatedAt: string;
  sync: SyncState;
}): LocalDataExportPackage {
  const sqlSnapshot = createSqlSnapshot(data);
  const body = {
    version: 1 as const,
    mode: "local-only" as const,
    generatedAt,
    app: {
      name: "Cuentas Claras" as const,
      defaultCurrency: "MXN" as const,
      realPaymentsEnabled: false as const,
    },
    inventory: getLocalDataInventory(),
    remoteDeletion: getRemoteDeletionStatus(),
    account,
    sync,
    data,
    sql: {
      schemaVersion: sqlSnapshot.schemaVersion,
      tableNames: sqlSnapshot.tableNames,
      schemaSql: sqlSnapshot.schemaSql,
      seedSql: sqlSnapshot.seedSql,
    },
  };

  return {
    ...body,
    checksum: checksum(stablePayloadJson(body)),
  };
}

export function verifyLocalDataExportPackage(exportPackage: LocalDataExportPackage) {
  const { checksum: expectedChecksum, ...body } = exportPackage;
  return checksum(stablePayloadJson(body)) === expectedChecksum;
}
