import type { SyncOutboxItem } from "../domain/types";

export type SyncConflictInput = {
  entityType: SyncOutboxItem["entityType"];
  operation: SyncOutboxItem["operation"];
  localRevision?: number;
  remoteRevision?: number;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  localDeletedAt?: string;
  remoteDeletedAt?: string;
  duplicateRemoteEntity?: boolean;
};

export type SyncConflictDecision =
  | {
      action: "send-local";
      reason: string;
      requiresUserAction: false;
    }
  | {
      action: "accept-remote";
      reason: string;
      requiresUserAction: false;
    }
  | {
      action: "skip-duplicate";
      reason: string;
      requiresUserAction: false;
    }
  | {
      action: "retry-after-refresh";
      reason: string;
      requiresUserAction: true;
    };

const appendOnlyEntities = new Set<SyncOutboxItem["entityType"]>([
  "activity_event",
  "expense_participant",
]);

function compareOptionalDate(left?: string, right?: string) {
  if (!left || !right) {
    return 0;
  }
  return left.localeCompare(right);
}

export function decideSyncConflict(input: SyncConflictInput): SyncConflictDecision {
  if (input.duplicateRemoteEntity) {
    if (input.entityType === "settlement") {
      return {
        action: "retry-after-refresh",
        reason: "Duplicate settlement risk must be refreshed before retry.",
        requiresUserAction: true,
      };
    }

    return {
      action: "skip-duplicate",
      reason: "Remote entity already exists for this local operation.",
      requiresUserAction: false,
    };
  }

  if (input.remoteDeletedAt && !input.localDeletedAt) {
    return {
      action: "accept-remote",
      reason: "Remote deletion wins until restore semantics are explicitly designed.",
      requiresUserAction: false,
    };
  }

  if (input.operation === "create" && appendOnlyEntities.has(input.entityType)) {
    return {
      action: "send-local",
      reason: "Append-only entity can be sent safely.",
      requiresUserAction: false,
    };
  }

  if (input.remoteRevision !== undefined && input.localRevision !== undefined) {
    if (input.localRevision < input.remoteRevision) {
      return {
        action: "retry-after-refresh",
        reason: "Local revision is stale relative to remote.",
        requiresUserAction: true,
      };
    }
    if (input.localRevision > input.remoteRevision) {
      return {
        action: "send-local",
        reason: "Local revision is newer than remote.",
        requiresUserAction: false,
      };
    }
  }

  const updatedAtComparison = compareOptionalDate(input.localUpdatedAt, input.remoteUpdatedAt);
  if (updatedAtComparison < 0) {
    return {
      action: "retry-after-refresh",
      reason: "Local update is older than remote update.",
      requiresUserAction: true,
    };
  }
  if (updatedAtComparison > 0) {
    return {
      action: "send-local",
      reason: "Local update is newer than remote update.",
      requiresUserAction: false,
    };
  }

  if (input.operation === "delete") {
    return {
      action: "retry-after-refresh",
      reason: "Deletes require explicit revision confirmation.",
      requiresUserAction: true,
    };
  }

  return {
    action: "send-local",
    reason: "No remote conflict detected.",
    requiresUserAction: false,
  };
}
