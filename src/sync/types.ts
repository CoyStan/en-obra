import type { AppData } from "../domain/types";

export type SyncEntity =
  | "user"
  | "group"
  | "group_member"
  | "expense"
  | "expense_participant"
  | "settlement"
  | "activity_event"
  | "account";

export type SyncOperation = "create" | "update" | "delete" | "snapshot";

export type SyncQueueItem = {
  id: string;
  entity: SyncEntity;
  operation: SyncOperation;
  entityId: string;
  createdAt: string;
  attempts: number;
};

export type SyncState = {
  version: 1;
  mode: "local-only" | "mock-sync" | "backend-ready";
  lastSyncedAt: string | null;
  pending: SyncQueueItem[];
  lastError: string | null;
};

export type SyncAdapter = {
  name: string;
  pushSnapshot(data: AppData, state: SyncState): Promise<SyncState>;
  enqueue(state: SyncState, item: Omit<SyncQueueItem, "id" | "createdAt" | "attempts">): SyncState;
  clearRemoteData(accountId: string): Promise<SyncState>;
};
