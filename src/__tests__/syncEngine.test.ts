import { describe, expect, it, vi } from "vitest";
import { demoData } from "../data/demoData";
import { createSyncOutboxItem } from "../backend/syncOutbox";
import { createMockSyncTransport, processSyncOutbox } from "../backend/syncEngine";
import { InMemoryBackendRepository, type BackendSnapshot } from "../backend/repository";
import { initialSyncState } from "../sync/localSyncAdapter";
import type { AccountState } from "../auth/types";
import type { AppData, SyncOutboxItem } from "../domain/types";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

const account: AccountState = {
  version: 1,
  mode: "guest",
  profile: null,
};

function outboxItem(id: string, entityId: string, createdAt: string): SyncOutboxItem {
  return createSyncOutboxItem({
    id,
    operation: "create",
    entityType: "expense",
    entityId,
    payload: { id: entityId, title: entityId },
    createdAt,
  });
}

function snapshotWithOutbox(items: SyncOutboxItem[]): BackendSnapshot {
  return {
    account,
    data: {
      ...(JSON.parse(JSON.stringify(demoData)) as AppData),
      syncOutbox: items,
    },
    sync: initialSyncState,
  };
}

describe("backend sync engine", () => {
  it("processes pending outbox records in deterministic order and marks them sent", async () => {
    const snapshot = snapshotWithOutbox([
      outboxItem("outbox-b", "expense-b", "2026-06-20T10:02:00Z"),
      outboxItem("outbox-a", "expense-a", "2026-06-20T10:01:00Z"),
    ]);

    const result = await processSyncOutbox(snapshot, createMockSyncTransport(), {
      now: () => "2026-06-20T10:03:00Z",
    });

    expect(result.attempted).toEqual(["outbox-a", "outbox-b"]);
    expect(result.sent).toEqual(["outbox-a", "outbox-b"]);
    expect(result.failed).toEqual([]);
    expect(result.snapshot.data.syncOutbox?.map((item) => [item.id, item.status, item.attemptCount])).toEqual([
      ["outbox-b", "sent", 1],
      ["outbox-a", "sent", 1],
    ]);
    expect(result.snapshot.sync).toMatchObject({
      mode: "mock-sync",
      lastSyncedAt: "2026-06-20T10:03:00Z",
      lastError: null,
    });
  });

  it("respects processing limits and leaves later pending records untouched", async () => {
    const snapshot = snapshotWithOutbox([
      outboxItem("outbox-a", "expense-a", "2026-06-20T10:01:00Z"),
      outboxItem("outbox-b", "expense-b", "2026-06-20T10:02:00Z"),
    ]);

    const result = await processSyncOutbox(snapshot, createMockSyncTransport(), {
      limit: 1,
      now: () => "2026-06-20T10:03:00Z",
    });

    expect(result.attempted).toEqual(["outbox-a"]);
    expect(result.snapshot.data.syncOutbox?.map((item) => [item.id, item.status, item.attemptCount])).toEqual([
      ["outbox-a", "sent", 1],
      ["outbox-b", "pending", 0],
    ]);
  });

  it("marks transport rejections failed without double-counting attempts", async () => {
    const snapshot = snapshotWithOutbox([
      outboxItem("outbox-a", "expense-a", "2026-06-20T10:01:00Z"),
    ]);

    const result = await processSyncOutbox(
      snapshot,
      createMockSyncTransport({ failEntityIds: ["expense-a"] }),
      { now: () => "2026-06-20T10:03:00Z" },
    );

    expect(result.sent).toEqual([]);
    expect(result.failed).toEqual(["outbox-a"]);
    expect(result.errors).toEqual([
      {
        id: "outbox-a",
        error: "Mock rejected expense:expense-a",
        retryable: true,
      },
    ]);
    expect(result.snapshot.data.syncOutbox?.[0]).toMatchObject({
      status: "failed",
      attemptCount: 1,
      lastAttemptAt: "2026-06-20T10:03:00Z",
    });
    expect(result.snapshot.sync.lastError).toBe("Mock rejected expense:expense-a");
  });

  it("marks thrown transport errors failed and retryable", async () => {
    const snapshot = snapshotWithOutbox([
      outboxItem("outbox-a", "expense-a", "2026-06-20T10:01:00Z"),
    ]);

    const result = await processSyncOutbox(
      snapshot,
      createMockSyncTransport({ throwEntityIds: ["expense-a"] }),
      { now: () => "2026-06-20T10:03:00Z" },
    );

    expect(result.failed).toEqual(["outbox-a"]);
    expect(result.errors).toEqual([
      {
        id: "outbox-a",
        error: "Mock transport failed for expense-a",
        retryable: true,
      },
    ]);
    expect(result.snapshot.data.syncOutbox?.[0]).toMatchObject({
      status: "failed",
      attemptCount: 1,
    });
  });

  it("does not mutate the input snapshot", async () => {
    const snapshot = snapshotWithOutbox([
      outboxItem("outbox-a", "expense-a", "2026-06-20T10:01:00Z"),
    ]);
    const original = JSON.stringify(snapshot);

    await processSyncOutbox(snapshot, createMockSyncTransport(), {
      now: () => "2026-06-20T10:03:00Z",
    });

    expect(JSON.stringify(snapshot)).toBe(original);
  });

  it("works with repository snapshots", async () => {
    const repository = new InMemoryBackendRepository(
      snapshotWithOutbox([outboxItem("outbox-a", "expense-a", "2026-06-20T10:01:00Z")]),
    );
    const loaded = await repository.load();
    const result = await processSyncOutbox(loaded, createMockSyncTransport(), {
      now: () => "2026-06-20T10:03:00Z",
    });

    await repository.save(result.snapshot);

    const saved = await repository.load();
    expect(saved.data.syncOutbox?.[0]).toMatchObject({
      id: "outbox-a",
      status: "sent",
      attemptCount: 1,
    });
    expect(saved.sync.mode).toBe("mock-sync");
  });
});
