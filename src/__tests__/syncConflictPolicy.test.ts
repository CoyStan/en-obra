import { describe, expect, it } from "vitest";
import { decideSyncConflict } from "../backend/syncConflictPolicy";

describe("sync conflict policy", () => {
  it("allows append-only expense participant creates", () => {
    expect(
      decideSyncConflict({
        entityType: "expense_participant",
        operation: "create",
      }),
    ).toEqual({
      action: "send-local",
      reason: "Append-only entity can be sent safely.",
      requiresUserAction: false,
    });
  });

  it("skips duplicate non-settlement creates", () => {
    expect(
      decideSyncConflict({
        duplicateRemoteEntity: true,
        entityType: "expense",
        operation: "create",
      }),
    ).toMatchObject({
      action: "skip-duplicate",
      requiresUserAction: false,
    });
  });

  it("does not silently duplicate settlements", () => {
    expect(
      decideSyncConflict({
        duplicateRemoteEntity: true,
        entityType: "settlement",
        operation: "create",
      }),
    ).toEqual({
      action: "retry-after-refresh",
      reason: "Duplicate settlement risk must be refreshed before retry.",
      requiresUserAction: true,
    });
  });

  it("requires refresh when local revision is stale", () => {
    expect(
      decideSyncConflict({
        entityType: "expense",
        operation: "update",
        localRevision: 2,
        remoteRevision: 3,
      }),
    ).toMatchObject({
      action: "retry-after-refresh",
      requiresUserAction: true,
    });
  });

  it("sends local changes when local revision is newer", () => {
    expect(
      decideSyncConflict({
        entityType: "group",
        operation: "update",
        localRevision: 4,
        remoteRevision: 3,
      }),
    ).toMatchObject({
      action: "send-local",
      requiresUserAction: false,
    });
  });

  it("accepts remote deletion until restore semantics exist", () => {
    expect(
      decideSyncConflict({
        entityType: "group_member",
        operation: "update",
        localUpdatedAt: "2026-06-20T10:00:00Z",
        remoteDeletedAt: "2026-06-20T10:05:00Z",
      }),
    ).toEqual({
      action: "accept-remote",
      reason: "Remote deletion wins until restore semantics are explicitly designed.",
      requiresUserAction: false,
    });
  });

  it("uses update timestamps when revisions are missing", () => {
    expect(
      decideSyncConflict({
        entityType: "expense",
        operation: "update",
        localUpdatedAt: "2026-06-20T10:06:00Z",
        remoteUpdatedAt: "2026-06-20T10:05:00Z",
      }),
    ).toMatchObject({
      action: "send-local",
    });

    expect(
      decideSyncConflict({
        entityType: "expense",
        operation: "update",
        localUpdatedAt: "2026-06-20T10:04:00Z",
        remoteUpdatedAt: "2026-06-20T10:05:00Z",
      }),
    ).toMatchObject({
      action: "retry-after-refresh",
    });
  });

  it("requires explicit confirmation for deletes with no revision context", () => {
    expect(
      decideSyncConflict({
        entityType: "expense",
        operation: "delete",
      }),
    ).toMatchObject({
      action: "retry-after-refresh",
      requiresUserAction: true,
    });
  });
});
