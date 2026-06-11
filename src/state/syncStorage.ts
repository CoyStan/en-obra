import AsyncStorage from "@react-native-async-storage/async-storage";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { SyncState } from "../sync/types";

export const SYNC_STORAGE_KEY = "cuentas-claras:sync:v1";

function isSyncState(value: unknown): value is SyncState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<SyncState>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.pending) &&
    (candidate.mode === "local-only" ||
      candidate.mode === "mock-sync" ||
      candidate.mode === "backend-ready")
  );
}

export async function loadSyncState() {
  const raw = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
  if (!raw) {
    return initialSyncState;
  }

  const parsed = JSON.parse(raw) as unknown;
  return isSyncState(parsed) ? parsed : initialSyncState;
}

export async function saveSyncState(state: SyncState) {
  await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(state));
}

export async function clearSyncState() {
  await AsyncStorage.removeItem(SYNC_STORAGE_KEY);
}
