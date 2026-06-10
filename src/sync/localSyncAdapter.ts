import { createId } from "../utils/id";
import type { SyncAdapter, SyncQueueItem, SyncState } from "./types";

export const initialSyncState: SyncState = {
  version: 1,
  mode: "local-only",
  lastSyncedAt: null,
  pending: [],
  lastError: null,
};

function now() {
  return new Date().toISOString();
}

function markQueuedAttempt(item: SyncQueueItem): SyncQueueItem {
  return {
    ...item,
    attempts: item.attempts + 1,
  };
}

export const localSyncAdapter: SyncAdapter = {
  name: "local-mock-sync",

  enqueue(state, item) {
    return {
      ...state,
      pending: [
        ...state.pending,
        {
          ...item,
          id: createId("sync"),
          createdAt: now(),
          attempts: 0,
        },
      ],
    };
  },

  async pushSnapshot(_data, state) {
    return {
      ...state,
      mode: "mock-sync",
      lastSyncedAt: now(),
      pending: state.pending.map(markQueuedAttempt),
      lastError: null,
    };
  },

  async clearRemoteData(_accountId) {
    return {
      ...initialSyncState,
      mode: "mock-sync",
      lastSyncedAt: now(),
    };
  },
};
