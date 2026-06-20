import { initialSyncState } from "../sync/localSyncAdapter";
import { SQL_SCHEMA_VERSION } from "./sqlSchema";
import { auditAndRepairAppData } from "./dataIntegrity";
import {
  type LocalDataExportPackage,
  verifyLocalDataExportPackage,
} from "./dataExport";
import type { BackendSnapshot } from "./repository";

export type LocalDataImportErrorCode =
  | "invalid-checksum"
  | "wrong-app"
  | "real-payments-enabled"
  | "unsupported-schema"
  | "invalid-mode";

export type LocalDataImportResult =
  | {
      ok: true;
      snapshot: BackendSnapshot;
      repairedIssueCount: number;
    }
  | {
      ok: false;
      code: LocalDataImportErrorCode;
      error: string;
    };

export function validateLocalDataImportPackage(exportPackage: LocalDataExportPackage): LocalDataImportResult {
  if (!verifyLocalDataExportPackage(exportPackage)) {
    return {
      ok: false,
      code: "invalid-checksum",
      error: "The local export package checksum does not match its contents.",
    };
  }

  if (exportPackage.app.name !== "Cuentas Claras" || exportPackage.app.defaultCurrency !== "MXN") {
    return {
      ok: false,
      code: "wrong-app",
      error: "The local export package is not for Cuentas Claras MXN data.",
    };
  }

  if (exportPackage.app.realPaymentsEnabled) {
    return {
      ok: false,
      code: "real-payments-enabled",
      error: "Packages that claim real payment support cannot be imported into this local-only build.",
    };
  }

  if (exportPackage.mode !== "local-only") {
    return {
      ok: false,
      code: "invalid-mode",
      error: "Only local-only export packages can be imported by this build.",
    };
  }

  if (exportPackage.sql.schemaVersion !== SQL_SCHEMA_VERSION) {
    return {
      ok: false,
      code: "unsupported-schema",
      error: `Unsupported SQL schema version ${exportPackage.sql.schemaVersion}.`,
    };
  }

  const repaired = auditAndRepairAppData(exportPackage.data);

  return {
    ok: true,
    repairedIssueCount: repaired.issues.length,
    snapshot: {
      account: exportPackage.account,
      data: repaired.data,
      sync: exportPackage.sync ?? initialSyncState,
    },
  };
}
