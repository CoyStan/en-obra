import { describe, expect, it } from "vitest";
import { demoData } from "../data/demoData";
import { initialSyncState, localSyncAdapter } from "../sync/localSyncAdapter";

describe("local sync adapter", () => {
  it("queues replaceable backend operations", () => {
    const queued = localSyncAdapter.enqueue(initialSyncState, {
      entity: "expense",
      operation: "create",
      entityId: "expense-1",
    });

    expect(queued.pending).toHaveLength(1);
    expect(queued.pending[0]).toMatchObject({
      entity: "expense",
      operation: "create",
      entityId: "expense-1",
      attempts: 0,
    });
  });

  it("marks a local mock sync without uploading data", async () => {
    const queued = localSyncAdapter.enqueue(initialSyncState, {
      entity: "group",
      operation: "snapshot",
      entityId: "group-oaxaca",
    });

    const synced = await localSyncAdapter.pushSnapshot(demoData, queued);

    expect(synced.mode).toBe("mock-sync");
    expect(synced.lastSyncedAt).toEqual(expect.any(String));
    expect(synced.pending[0].attempts).toBe(1);
    expect(localSyncAdapter.name).toBe("local-mock-sync");
  });
});
