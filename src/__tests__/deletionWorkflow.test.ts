import { describe, expect, it } from "vitest";
import {
  createDeletionRequest,
  summarizeDeletionRequest,
  transitionDeletionRequest,
} from "../backend/deletionWorkflow";

function unwrap<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  expect(result.ok).toBe(true);
  return result as Extract<T, { ok: true }>;
}

describe("provider-neutral deletion workflow", () => {
  it("creates a tracked local deletion request", () => {
    const result = createDeletionRequest({
      id: "delete-1",
      accountId: "account-1",
      scope: "local-device",
      requestedAt: "2026-06-20T12:00:00Z",
    });

    expect(result).toEqual({
      ok: true,
      request: {
        id: "delete-1",
        accountId: "account-1",
        scope: "local-device",
        status: "requested",
        requestedAt: "2026-06-20T12:00:00Z",
        updatedAt: "2026-06-20T12:00:00Z",
      },
    });
  });

  it("rejects requests without an account id", () => {
    expect(
      createDeletionRequest({
        id: "delete-1",
        accountId: "",
        scope: "local-device",
        requestedAt: "2026-06-20T12:00:00Z",
      }),
    ).toEqual({
      ok: false,
      error: "Account id is required for deletion workflow tracking.",
    });
  });

  it("supports verified queued completed lifecycle", () => {
    const created = unwrap(
      createDeletionRequest({
        id: "delete-1",
        accountId: "account-1",
        scope: "future-remote-account",
        requestedAt: "2026-06-20T12:00:00Z",
      }),
    ).request;
    const verified = unwrap(transitionDeletionRequest(created, "verified", "2026-06-20T12:01:00Z")).request;
    const queued = unwrap(transitionDeletionRequest(verified, "queued", "2026-06-20T12:02:00Z")).request;
    const completed = unwrap(transitionDeletionRequest(queued, "completed", "2026-06-20T12:03:00Z")).request;

    expect(completed).toMatchObject({
      status: "completed",
      verifiedAt: "2026-06-20T12:01:00Z",
      queuedAt: "2026-06-20T12:02:00Z",
      completedAt: "2026-06-20T12:03:00Z",
      updatedAt: "2026-06-20T12:03:00Z",
    });
  });

  it("rejects unsafe lifecycle transitions", () => {
    const created = unwrap(
      createDeletionRequest({
        id: "delete-1",
        accountId: "account-1",
        scope: "future-remote-account",
        requestedAt: "2026-06-20T12:00:00Z",
      }),
    ).request;

    expect(transitionDeletionRequest(created, "completed", "2026-06-20T12:01:00Z")).toEqual({
      ok: false,
      error: "Cannot transition deletion request from requested to completed.",
    });
  });

  it("requires failure reasons", () => {
    const created = unwrap(
      createDeletionRequest({
        id: "delete-1",
        accountId: "account-1",
        scope: "future-remote-account",
        requestedAt: "2026-06-20T12:00:00Z",
      }),
    ).request;

    expect(transitionDeletionRequest(created, "failed", "2026-06-20T12:01:00Z")).toEqual({
      ok: false,
      error: "Failure reason is required when marking deletion failed.",
    });

    expect(
      transitionDeletionRequest(created, "failed", "2026-06-20T12:01:00Z", {
        failureReason: "remote endpoint not configured",
      }),
    ).toMatchObject({
      ok: true,
      request: {
        status: "failed",
        failureReason: "remote endpoint not configured",
      },
    });
  });

  it("summarizes remote workflow without endpoint or contact details", () => {
    const request = unwrap(
      createDeletionRequest({
        id: "delete-1",
        accountId: "account-with-email-like-value",
        scope: "future-remote-account",
        requestedAt: "2026-06-20T12:00:00Z",
      }),
    ).request;
    const summary = summarizeDeletionRequest(request);
    const serialized = JSON.stringify(summary);

    expect(summary).toEqual({
      id: "delete-1",
      scope: "future-remote-account",
      status: "requested",
      requestedAt: "2026-06-20T12:00:00Z",
      updatedAt: "2026-06-20T12:00:00Z",
      remoteEndpointConfigured: false,
      requiresHumanApproval: true,
    });
    expect(serialized).not.toContain("account-with-email-like-value");
  });
});
