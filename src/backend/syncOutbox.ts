import type { SyncOutboxItem } from "../domain/types";
import { createId } from "../utils/id";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type CreateOutboxInput = {
  operation: SyncOutboxItem["operation"];
  entityType: SyncOutboxItem["entityType"];
  entityId: string;
  payload: unknown;
  createdAt: string;
  id?: string;
};

function normalizeJson(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeJson(entry)]),
    );
  }
  return null;
}

export function stablePayloadJson(payload: unknown) {
  return JSON.stringify(normalizeJson(payload));
}

export function createSyncOutboxItem(input: CreateOutboxInput): SyncOutboxItem {
  return {
    id: input.id ?? createId("outbox"),
    operation: input.operation,
    entityType: input.entityType,
    entityId: input.entityId,
    payloadJson: stablePayloadJson(input.payload),
    status: "pending",
    attemptCount: 0,
    createdAt: input.createdAt,
  };
}

export function parseOutboxPayload<T>(item: SyncOutboxItem): T {
  return JSON.parse(item.payloadJson) as T;
}

export function pendingOutboxItems(items: SyncOutboxItem[]) {
  return items
    .filter((item) => item.status === "pending")
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
}

export function markOutboxAttempt(items: SyncOutboxItem[], id: string, attemptedAt: string) {
  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          attemptCount: item.attemptCount + 1,
          lastAttemptAt: attemptedAt,
        }
      : item,
  );
}

export function markOutboxSent(items: SyncOutboxItem[], id: string, sentAt: string) {
  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "sent" as const,
          lastAttemptAt: sentAt,
        }
      : item,
  );
}

export function markOutboxFailed(items: SyncOutboxItem[], id: string, failedAt: string) {
  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "failed" as const,
          attemptCount: item.attemptCount + 1,
          lastAttemptAt: failedAt,
        }
      : item,
  );
}
