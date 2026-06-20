import type { AccountState } from "../auth/types";
import { demoData } from "../data/demoData";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { SyncState } from "../sync/types";
import type { AppData } from "../domain/types";
import { auditAndRepairAppData } from "./dataIntegrity";
import { createLocalDataExportPackage, type LocalDataExportPackage } from "./dataExport";
import type { MutationResult } from "./appMutations";

export type BackendSnapshot = {
  data: AppData;
  account: AccountState;
  sync: SyncState;
};

export type BackendRepository = {
  load(): Promise<BackendSnapshot>;
  save(snapshot: BackendSnapshot): Promise<BackendSnapshot>;
  mutate(apply: (current: AppData) => MutationResult): Promise<MutationResult>;
  exportData(generatedAt: string): Promise<LocalDataExportPackage>;
  deleteLocalData(completedAt: string): Promise<BackendSnapshot>;
};

const emptyAccount: AccountState = {
  version: 1,
  mode: "guest",
  profile: null,
};

function cloneDemoData(): AppData {
  return JSON.parse(JSON.stringify(demoData)) as AppData;
}

function cloneSnapshot(snapshot: BackendSnapshot): BackendSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as BackendSnapshot;
}

function sanitizeSnapshot(snapshot: BackendSnapshot): BackendSnapshot {
  return {
    ...snapshot,
    data: auditAndRepairAppData(snapshot.data).data,
  };
}

export class InMemoryBackendRepository implements BackendRepository {
  private snapshot: BackendSnapshot;

  constructor(snapshot?: Partial<BackendSnapshot>) {
    this.snapshot = sanitizeSnapshot({
      data: snapshot?.data ?? cloneDemoData(),
      account: snapshot?.account ?? emptyAccount,
      sync: snapshot?.sync ?? initialSyncState,
    });
  }

  async load(): Promise<BackendSnapshot> {
    return cloneSnapshot(this.snapshot);
  }

  async save(snapshot: BackendSnapshot): Promise<BackendSnapshot> {
    this.snapshot = sanitizeSnapshot(snapshot);
    return this.load();
  }

  async mutate(apply: (current: AppData) => MutationResult): Promise<MutationResult> {
    const result = apply(this.snapshot.data);
    if (!result.ok) {
      return result;
    }

    this.snapshot = sanitizeSnapshot({
      ...this.snapshot,
      data: result.data,
    });
    return {
      ok: true,
      data: cloneSnapshot(this.snapshot).data,
    };
  }

  async exportData(generatedAt: string): Promise<LocalDataExportPackage> {
    return createLocalDataExportPackage({
      account: this.snapshot.account,
      data: this.snapshot.data,
      generatedAt,
      sync: this.snapshot.sync,
    });
  }

  async deleteLocalData(_completedAt: string): Promise<BackendSnapshot> {
    this.snapshot = sanitizeSnapshot({
      data: cloneDemoData(),
      account: emptyAccount,
      sync: initialSyncState,
    });
    return this.load();
  }
}
