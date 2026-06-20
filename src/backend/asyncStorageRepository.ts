import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCOUNT_STORAGE_KEY } from "../auth/localAccountAdapter";
import type { AccountState } from "../auth/types";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { SyncState } from "../sync/types";
import {
  APP_DATA_STORAGE_KEY,
  clearPersistedData,
  cloneDemoData,
  loadPersistedData,
  persistData,
} from "../state/storage";
import { clearSyncState, loadSyncState, saveSyncState, SYNC_STORAGE_KEY } from "../state/syncStorage";
import type { AppData } from "../domain/types";
import { auditAndRepairAppData } from "./dataIntegrity";
import { createLocalDataExportPackage, type LocalDataExportPackage } from "./dataExport";
import type { MutationResult } from "./appMutations";
import type { BackendRepository, BackendSnapshot } from "./repository";

const emptyAccount: AccountState = {
  version: 1,
  mode: "guest",
  profile: null,
};

function isAccountState(value: unknown): value is AccountState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AccountState>;
  return (
    candidate.version === 1 &&
    (candidate.mode === "guest" || candidate.mode === "signed-in") &&
    "profile" in candidate
  );
}

function cloneSnapshot(snapshot: BackendSnapshot): BackendSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as BackendSnapshot;
}

async function loadAccountState(): Promise<AccountState> {
  const raw = await AsyncStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!raw) {
    return emptyAccount;
  }
  const parsed = JSON.parse(raw) as unknown;
  return isAccountState(parsed) ? parsed : emptyAccount;
}

async function saveAccountState(state: AccountState) {
  await AsyncStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(state));
}

async function persistSnapshot(snapshot: BackendSnapshot): Promise<BackendSnapshot> {
  const sanitized: BackendSnapshot = {
    account: snapshot.account,
    data: auditAndRepairAppData(snapshot.data).data,
    sync: snapshot.sync,
  };

  await persistData(sanitized.data);
  await saveAccountState(sanitized.account);
  await saveSyncState(sanitized.sync);
  return cloneSnapshot(sanitized);
}

export class AsyncStorageBackendRepository implements BackendRepository {
  async load(): Promise<BackendSnapshot> {
    return {
      account: await loadAccountState(),
      data: await loadPersistedData(),
      sync: await loadSyncState(),
    };
  }

  async save(snapshot: BackendSnapshot): Promise<BackendSnapshot> {
    return persistSnapshot(snapshot);
  }

  async mutate(apply: (current: AppData) => MutationResult): Promise<MutationResult> {
    const current = await this.load();
    const result = apply(current.data);
    if (!result.ok) {
      return result;
    }

    const saved = await this.save({
      ...current,
      data: result.data,
    });
    return {
      ok: true,
      data: saved.data,
    };
  }

  async exportData(generatedAt: string): Promise<LocalDataExportPackage> {
    const snapshot = await this.load();
    return createLocalDataExportPackage({
      account: snapshot.account,
      data: snapshot.data,
      generatedAt,
      sync: snapshot.sync,
    });
  }

  async deleteLocalData(_completedAt: string): Promise<BackendSnapshot> {
    await clearPersistedData();
    await clearSyncState();
    await AsyncStorage.removeItem(ACCOUNT_STORAGE_KEY);

    return {
      account: emptyAccount,
      data: cloneDemoData(),
      sync: initialSyncState,
    };
  }
}

export const asyncStorageBackendRepositoryKeys = {
  account: ACCOUNT_STORAGE_KEY,
  data: APP_DATA_STORAGE_KEY,
  sync: SYNC_STORAGE_KEY,
};
