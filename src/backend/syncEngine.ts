import type { SyncOutboxItem } from "../domain/types";
import type { BackendSnapshot } from "./repository";
import { markOutboxAttempt, markOutboxFailed, markOutboxSent, pendingOutboxItems } from "./syncOutbox";

export type SyncTransportResult =
  | {
      ok: true;
      remoteId?: string;
    }
  | {
      ok: false;
      error: string;
      retryable: boolean;
    };

export type SyncTransport = {
  name: string;
  send(item: SyncOutboxItem): Promise<SyncTransportResult>;
};

export type SyncEngineOptions = {
  limit?: number;
  now?: () => string;
};

export type SyncEngineError = {
  id: string;
  error: string;
  retryable: boolean;
};

export type SyncEngineResult = {
  snapshot: BackendSnapshot;
  attempted: string[];
  sent: string[];
  failed: string[];
  errors: SyncEngineError[];
};

function cloneSnapshot(snapshot: BackendSnapshot): BackendSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as BackendSnapshot;
}

function replaceOutboxItem(items: SyncOutboxItem[], updated: SyncOutboxItem) {
  return items.map((item) => (item.id === updated.id ? updated : item));
}

function findOutboxItem(items: SyncOutboxItem[], id: string) {
  const found = items.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Missing sync outbox item ${id}`);
  }
  return found;
}

export async function processSyncOutbox(
  snapshot: BackendSnapshot,
  transport: SyncTransport,
  options: SyncEngineOptions = {},
): Promise<SyncEngineResult> {
  const next = cloneSnapshot(snapshot);
  let items = [...(next.data.syncOutbox ?? [])];
  const pending = pendingOutboxItems(items);
  const limit = options.limit ?? pending.length;
  const selected = pending.slice(0, Math.max(0, limit));
  const now = options.now ?? (() => new Date().toISOString());
  const attempted: string[] = [];
  const sent: string[] = [];
  const failed: string[] = [];
  const errors: SyncEngineError[] = [];
  let lastAttemptAt: string | null = null;

  for (const item of selected) {
    const attemptedAt = now();
    lastAttemptAt = attemptedAt;
    attempted.push(item.id);

    try {
      const result = await transport.send(item);
      const attemptedItems = markOutboxAttempt(items, item.id, attemptedAt);

      if (result.ok) {
        items = markOutboxSent(attemptedItems, item.id, attemptedAt);
        sent.push(item.id);
      } else {
        const attemptedItem = findOutboxItem(attemptedItems, item.id);
        items = replaceOutboxItem(attemptedItems, {
          ...attemptedItem,
          status: "failed",
          lastAttemptAt: attemptedAt,
        });
        failed.push(item.id);
        errors.push({ id: item.id, error: result.error, retryable: result.retryable });
      }
    } catch (error) {
      items = markOutboxFailed(items, item.id, attemptedAt);
      failed.push(item.id);
      errors.push({
        id: item.id,
        error: error instanceof Error ? error.message : "Unknown sync transport error",
        retryable: true,
      });
    }
  }

  next.data.syncOutbox = items;
  next.sync = {
    ...next.sync,
    mode: "mock-sync",
    lastSyncedAt: sent.length && !errors.length ? lastAttemptAt : next.sync.lastSyncedAt,
    lastError: errors.at(-1)?.error ?? null,
  };

  return {
    snapshot: next,
    attempted,
    sent,
    failed,
    errors,
  };
}

export function createMockSyncTransport(options: {
  failEntityIds?: string[];
  failEntityTypes?: SyncOutboxItem["entityType"][];
  throwEntityIds?: string[];
} = {}): SyncTransport {
  const failEntityIds = new Set(options.failEntityIds ?? []);
  const failEntityTypes = new Set(options.failEntityTypes ?? []);
  const throwEntityIds = new Set(options.throwEntityIds ?? []);

  return {
    name: "mock-sync-transport",

    async send(item) {
      if (throwEntityIds.has(item.entityId)) {
        throw new Error(`Mock transport failed for ${item.entityId}`);
      }
      if (failEntityIds.has(item.entityId) || failEntityTypes.has(item.entityType)) {
        return {
          ok: false,
          error: `Mock rejected ${item.entityType}:${item.entityId}`,
          retryable: true,
        };
      }
      return {
        ok: true,
        remoteId: `${item.entityType}:${item.entityId}`,
      };
    },
  };
}
