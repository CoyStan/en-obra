import { describe, expect, it } from "vitest";
import {
  createSyncOutboxItem,
  markOutboxAttempt,
  markOutboxFailed,
  markOutboxSent,
  parseOutboxPayload,
  pendingOutboxItems,
  stablePayloadJson,
} from "../backend/syncOutbox";
import type { SyncOutboxItem } from "../domain/types";

describe("sync outbox lifecycle", () => {
  it("serializes payload JSON deterministically", () => {
    expect(stablePayloadJson({ b: 2, a: { d: 4, c: 3 }, z: undefined })).toBe(
      '{"a":{"c":3,"d":4},"b":2}',
    );
  });

  it("creates pending outbox records for backend adapters", () => {
    const item = createSyncOutboxItem({
      id: "outbox-1",
      operation: "create",
      entityType: "expense",
      entityId: "expense-1",
      payload: { title: "Cena", amountCents: 12000 },
      createdAt: "2026-06-20T10:00:00Z",
    });

    expect(item).toEqual({
      id: "outbox-1",
      operation: "create",
      entityType: "expense",
      entityId: "expense-1",
      payloadJson: '{"amountCents":12000,"title":"Cena"}',
      status: "pending",
      attemptCount: 0,
      createdAt: "2026-06-20T10:00:00Z",
    });
  });

  it("returns pending items in created order and ignores sent/failed rows", () => {
    const items: SyncOutboxItem[] = [
      createSyncOutboxItem({
        id: "outbox-c",
        operation: "create",
        entityType: "group",
        entityId: "group-c",
        payload: {},
        createdAt: "2026-06-20T10:02:00Z",
      }),
      {
        ...createSyncOutboxItem({
          id: "outbox-sent",
          operation: "create",
          entityType: "group",
          entityId: "group-sent",
          payload: {},
          createdAt: "2026-06-20T10:00:00Z",
        }),
        status: "sent",
      },
      createSyncOutboxItem({
        id: "outbox-a",
        operation: "create",
        entityType: "group",
        entityId: "group-a",
        payload: {},
        createdAt: "2026-06-20T10:01:00Z",
      }),
    ];

    expect(pendingOutboxItems(items).map((item) => item.id)).toEqual(["outbox-a", "outbox-c"]);
  });

  it("tracks attempts, sent state, failed state, and parses payloads", () => {
    const createdAt = "2026-06-20T10:00:00Z";
    const attemptedAt = "2026-06-20T10:01:00Z";
    const item = createSyncOutboxItem({
      id: "outbox-1",
      operation: "create",
      entityType: "settlement",
      entityId: "settlement-1",
      payload: { amountCents: 5000 },
      createdAt,
    });

    const attempted = markOutboxAttempt([item], item.id, attemptedAt);
    const failed = markOutboxFailed(attempted, item.id, "2026-06-20T10:02:00Z");
    const sent = markOutboxSent(failed, item.id, "2026-06-20T10:03:00Z");

    expect(attempted[0]).toMatchObject({ attemptCount: 1, lastAttemptAt: attemptedAt, status: "pending" });
    expect(failed[0]).toMatchObject({ attemptCount: 2, status: "failed" });
    expect(sent[0]).toMatchObject({ attemptCount: 2, status: "sent", lastAttemptAt: "2026-06-20T10:03:00Z" });
    expect(parseOutboxPayload<{ amountCents: number }>(item)).toEqual({ amountCents: 5000 });
  });
});
