export type DeletionRequestStatus =
  | "requested"
  | "verified"
  | "queued"
  | "completed"
  | "failed"
  | "cancelled";

export type DeletionRequestScope = "local-device" | "future-remote-account";

export type DeletionRequest = {
  id: string;
  accountId: string;
  scope: DeletionRequestScope;
  status: DeletionRequestStatus;
  requestedAt: string;
  updatedAt: string;
  verifiedAt?: string;
  queuedAt?: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  failureReason?: string;
};

export type DeletionWorkflowResult =
  | {
      ok: true;
      request: DeletionRequest;
    }
  | {
      ok: false;
      error: string;
    };

export type DeletionWorkflowSummary = {
  id: string;
  scope: DeletionRequestScope;
  status: DeletionRequestStatus;
  requestedAt: string;
  updatedAt: string;
  remoteEndpointConfigured: false;
  requiresHumanApproval: boolean;
};

const allowedTransitions: Record<DeletionRequestStatus, DeletionRequestStatus[]> = {
  requested: ["verified", "cancelled", "failed"],
  verified: ["queued", "cancelled", "failed"],
  queued: ["completed", "failed"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function createDeletionRequest(input: {
  id: string;
  accountId: string;
  scope: DeletionRequestScope;
  requestedAt: string;
}): DeletionWorkflowResult {
  if (!input.id.trim()) {
    return { ok: false, error: "Deletion request id is required." };
  }
  if (!input.accountId.trim()) {
    return { ok: false, error: "Account id is required for deletion workflow tracking." };
  }

  return {
    ok: true,
    request: {
      id: input.id,
      accountId: input.accountId,
      scope: input.scope,
      status: "requested",
      requestedAt: input.requestedAt,
      updatedAt: input.requestedAt,
    },
  };
}

export function transitionDeletionRequest(
  request: DeletionRequest,
  nextStatus: DeletionRequestStatus,
  occurredAt: string,
  options: { failureReason?: string } = {},
): DeletionWorkflowResult {
  if (!allowedTransitions[request.status].includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot transition deletion request from ${request.status} to ${nextStatus}.`,
    };
  }

  if (nextStatus === "failed" && !options.failureReason?.trim()) {
    return {
      ok: false,
      error: "Failure reason is required when marking deletion failed.",
    };
  }

  return {
    ok: true,
    request: {
      ...request,
      status: nextStatus,
      updatedAt: occurredAt,
      verifiedAt: nextStatus === "verified" ? occurredAt : request.verifiedAt,
      queuedAt: nextStatus === "queued" ? occurredAt : request.queuedAt,
      completedAt: nextStatus === "completed" ? occurredAt : request.completedAt,
      failedAt: nextStatus === "failed" ? occurredAt : request.failedAt,
      cancelledAt: nextStatus === "cancelled" ? occurredAt : request.cancelledAt,
      failureReason: nextStatus === "failed" ? options.failureReason : request.failureReason,
    },
  };
}

export function summarizeDeletionRequest(request: DeletionRequest): DeletionWorkflowSummary {
  return {
    id: request.id,
    scope: request.scope,
    status: request.status,
    requestedAt: request.requestedAt,
    updatedAt: request.updatedAt,
    remoteEndpointConfigured: false,
    requiresHumanApproval: request.scope === "future-remote-account",
  };
}
